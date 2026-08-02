const admin = require("firebase-admin");
const { randomInt } = require("node:crypto");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");

admin.initializeApp();
setGlobalOptions({ region: "us-central1" });

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const REQUEST_COOLDOWN_MS = 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_CODES_PER_WINDOW = 5;
const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "MaviTeam <no-reply@maviteam.com>";
const resendApiKey = defineSecret("RESEND_API_KEY");

const ATTENDANCE_RETENTION_DAYS = 14;
const ATTENDANCE_CLEANUP_BATCH_SIZE = 300;
const ATTENDANCE_STATUS_FIELDS = ["present", "absent", "late", "excused"];

function createVerificationCode() {
  return randomInt(100000, 1000000).toString();
}

function normalizeCode(value) {
  return String(value ?? "").replace(/[^0-9]/g, "").slice(0, 6);
}

function timestampToMillis(value) {
  if (value && typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function getNextRateLimitState(data, nowMillis) {
  const lastRequestedAtMillis = timestampToMillis(data?.requestedAt || data?.updatedAt || data?.createdAt);

  if (
    data?.status === "pending" &&
    lastRequestedAtMillis > 0 &&
    nowMillis - lastRequestedAtMillis < REQUEST_COOLDOWN_MS
  ) {
    throw new HttpsError("resource-exhausted", "Please wait before requesting another verification code.");
  }

  const rateLimit = data?.rateLimit || {};
  const windowStartedAtMillis = timestampToMillis(rateLimit.windowStartedAt);

  if (windowStartedAtMillis <= 0 || nowMillis - windowStartedAtMillis >= RATE_LIMIT_WINDOW_MS) {
    return {
      windowStartedAt: admin.firestore.Timestamp.fromMillis(nowMillis),
      count: 1,
    };
  }

  const currentCount = typeof rateLimit.count === "number" ? rateLimit.count : 0;

  if (currentCount >= MAX_CODES_PER_WINDOW) {
    throw new HttpsError("resource-exhausted", "Too many verification code requests. Please try again later.");
  }

  return {
    windowStartedAt: rateLimit.windowStartedAt,
    count: currentCount + 1,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getAuthenticatedUser(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to verify your email.");
  }

  const email = request.auth.token.email;

  if (!email) {
    throw new HttpsError("failed-precondition", "Your account does not have an email address.");
  }

  return {
    uid: request.auth.uid,
    email,
    name: request.auth.token.name || "MaviTeam User",
  };
}

function buildEmailHtml(code, displayName) {
  const safeDisplayName = escapeHtml(displayName);
  const safeCode = escapeHtml(code);

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
      <h2 style="margin:0 0 12px;color:#2563eb">MaviTeam verification code</h2>
      <p>Hi ${safeDisplayName},</p>
      <p>Your MaviTeam verification code is:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:6px;margin:20px 0;color:#0f172a">${safeCode}</p>
      <p>This code expires in 10 minutes.</p>
      <p>If you did not request this code, you can ignore this email.</p>
    </div>
  `;
}

function buildEmailText(code, displayName) {
  return `Hi ${displayName}, your MaviTeam verification code is ${code}. This code expires in 10 minutes.`;
}

async function sendVerificationEmail({ apiKey, to, code, displayName }) {
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "Email delivery is not configured yet.");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject: "Your MaviTeam verification code",
      text: buildEmailText(code, displayName),
      html: buildEmailHtml(code, displayName),
    }),
  });

  let body = {};

  try {
    body = await response.json();
  } catch (error) {
    body = { message: "Resend returned a non-JSON response." };
  }

  if (!response.ok) {
    console.error("Resend verification email failed", {
      status: response.status,
      error: body?.message || body?.error || body,
    });
    throw new HttpsError("internal", "We could not send your verification code. Please try again.");
  }

  return body;
}

exports.requestEmailVerificationCode = onCall({ secrets: [resendApiKey] }, async (request) => {
  const user = getAuthenticatedUser(request);
  const db = admin.firestore();
  const codeRef = db.doc(`emailVerificationCodes/${user.uid}`);
  const code = createVerificationCode();
  const nowMillis = Date.now();
  const now = admin.firestore.Timestamp.fromMillis(nowMillis);
  const expiresAt = admin.firestore.Timestamp.fromMillis(nowMillis + CODE_TTL_MS);
  const displayName = String(request.data?.fullName || user.name).trim() || "MaviTeam User";

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(codeRef);
    const rateLimit = getNextRateLimitState(snapshot.exists ? snapshot.data() : null, nowMillis);

    transaction.set(codeRef, {
      uid: user.uid,
      email: user.email,
      code,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      purpose: "emailVerification",
      status: "pending",
      requestedAt: now,
      expiresAt,
      rateLimit,
      createdAt: now,
      updatedAt: now,
    });
  });

  try {
    const delivery = await sendVerificationEmail({
      apiKey: resendApiKey.value(),
      to: user.email,
      code,
      displayName,
    });

    await codeRef.update({
      emailDelivery: {
        provider: "resend",
        status: "sent",
        messageId: delivery?.id || null,
        sentAt: admin.firestore.Timestamp.now(),
      },
      updatedAt: admin.firestore.Timestamp.now(),
    });
  } catch (error) {
    await codeRef.update({
      status: "emailFailed",
      emailDelivery: {
        provider: "resend",
        status: "failed",
        failedAt: admin.firestore.Timestamp.now(),
      },
      updatedAt: admin.firestore.Timestamp.now(),
    });

    throw error;
  }

  const response = {
    ok: true,
    expiresAt: expiresAt.toDate().toISOString(),
  };

  if (process.env.FUNCTIONS_EMULATOR === "true" || process.env.MAVITEAM_RETURN_DEV_CODE === "true") {
    response.devCode = code;
  }

  return response;
});

exports.verifyEmailCode = onCall(async (request) => {
  const user = getAuthenticatedUser(request);
  const db = admin.firestore();
  const inputCode = normalizeCode(request.data?.code);

  if (inputCode.length !== 6) {
    throw new HttpsError("invalid-argument", "Please enter the 6-digit verification code.");
  }

  const codeRef = db.doc(`emailVerificationCodes/${user.uid}`);
  let shouldMarkAuthVerified = false;

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(codeRef);

    if (!snapshot.exists) {
      throw new HttpsError("not-found", "No active verification code was found. Please request a new code.");
    }

    const data = snapshot.data();
    const attempts = typeof data.attempts === "number" ? data.attempts : 0;
    const expiresAt = data.expiresAt;

    if (data.email !== user.email || data.uid !== user.uid) {
      throw new HttpsError("permission-denied", "This code does not belong to your account.");
    }

    if (data.status === "verified") {
      shouldMarkAuthVerified = true;
      return;
    }

    if (data.status !== "pending") {
      throw new HttpsError("failed-precondition", "This verification code is no longer active.");
    }

    if (!expiresAt || expiresAt.toMillis() < Date.now()) {
      transaction.update(codeRef, {
        status: "expired",
        updatedAt: admin.firestore.Timestamp.now(),
      });
      throw new HttpsError("deadline-exceeded", "This verification code expired. Please request a new code.");
    }

    if (attempts >= MAX_ATTEMPTS) {
      transaction.update(codeRef, {
        status: "locked",
        updatedAt: admin.firestore.Timestamp.now(),
      });
      throw new HttpsError("resource-exhausted", "Too many incorrect attempts. Please request a new code.");
    }

    if (data.code !== inputCode) {
      transaction.update(codeRef, {
        attempts: attempts + 1,
        updatedAt: admin.firestore.Timestamp.now(),
      });
      throw new HttpsError("invalid-argument", "The verification code is incorrect.");
    }

    transaction.update(codeRef, {
      status: "verified",
      verifiedAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
    shouldMarkAuthVerified = true;
  });

  if (shouldMarkAuthVerified) {
    await admin.auth().updateUser(user.uid, { emailVerified: true });
  }

  return { ok: true };
});

// Attendance records older than ATTENDANCE_RETENTION_DAYS are deleted to
// keep the collection from growing forever, but each record's status is
// first folded into attendanceSummaries/{userId}.years.{year} (a running
// present/absent/late/excused/total tally) so a user's yearly attendance
// average survives even after the day-by-day record is gone. Processes at
// most ATTENDANCE_CLEANUP_BATCH_SIZE records per run and stays under
// Firestore's 500-write batch limit (deletes + summary upserts combined);
// this runs daily, so any backlog beyond one batch is simply picked up on
// the next run rather than needing to be handled all at once.
async function runAttendanceCleanup(db) {
  const cutoffIso = new Date(Date.now() - ATTENDANCE_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const oldRecordsSnapshot = await db
    .collection("attendanceRecords")
    .where("sessionDate", "<", cutoffIso)
    .limit(ATTENDANCE_CLEANUP_BATCH_SIZE)
    .get();

  if (oldRecordsSnapshot.empty) {
    return { deletedCount: 0, summarizedUserCount: 0 };
  }

  const deltasByUserId = new Map();

  for (const recordSnapshot of oldRecordsSnapshot.docs) {
    const record = recordSnapshot.data();
    const userId = record.userId;
    const clubId = record.clubId;
    const status = record.status;
    const sessionYear = new Date(record.sessionDate).getFullYear();

    if (typeof userId !== "string" || typeof clubId !== "string" || Number.isNaN(sessionYear)) {
      continue;
    }

    if (!deltasByUserId.has(userId)) {
      deltasByUserId.set(userId, { clubId, years: {} });
    }

    const userDelta = deltasByUserId.get(userId);

    if (!userDelta.years[sessionYear]) {
      userDelta.years[sessionYear] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    }

    if (ATTENDANCE_STATUS_FIELDS.includes(status)) {
      userDelta.years[sessionYear][status] += 1;
    }

    userDelta.years[sessionYear].total += 1;
  }

  const batch = db.batch();

  for (const recordSnapshot of oldRecordsSnapshot.docs) {
    batch.delete(recordSnapshot.ref);
  }

  for (const [userId, delta] of deltasByUserId.entries()) {
    // Nested objects (not dotted-string keys) are required here: set()'s
    // merge only recurses into genuinely nested maps, it does not treat a
    // flat key like "years.2026.present" as a path -- that would just
    // create a literal field named "years.2026.present".
    const years = {};

    for (const [year, totals] of Object.entries(delta.years)) {
      years[year] = {};

      for (const field of [...ATTENDANCE_STATUS_FIELDS, "total"]) {
        years[year][field] = admin.firestore.FieldValue.increment(totals[field]);
      }
    }

    const summaryUpdate = {
      userId,
      clubId: delta.clubId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      years,
    };

    batch.set(db.doc(`attendanceSummaries/${userId}`), summaryUpdate, { merge: true });
  }

  await batch.commit();

  return { deletedCount: oldRecordsSnapshot.size, summarizedUserCount: deltasByUserId.size };
}

exports.runAttendanceCleanup = runAttendanceCleanup;

exports.cleanupOldAttendance = onSchedule("every 24 hours", async () => {
  const db = admin.firestore();
  const result = await runAttendanceCleanup(db);
  console.log("Attendance cleanup finished", result);
});
