const admin = require("firebase-admin");
const Sentry = require("@sentry/node");
const { randomInt } = require("node:crypto");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const { Webhook } = require("svix");

admin.initializeApp();
setGlobalOptions({ region: "us-central1" });

// SENTRY_DSN is loaded from functions/.env at deploy time (Firebase
// Functions v2's built-in dotenv support), not defineSecret -- a DSN isn't
// actually secret (it's a write-only ingestion endpoint), so it doesn't
// need Secret Manager, and a plain process.env value is readable here at
// module load time instead of only inside a handler that declares it.
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0 });
}

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
// Cooldown before the Nth request in the window (N-1 is the array index),
// escalating instead of a flat 60s. A burst of near-identical emails to the
// same address in a short window is exactly the pattern inbox providers
// bounce/spam-flag on, which is what feeds Resend's suppression list -- so
// spacing repeat sends out further apart is a real mitigation, not just a
// friendlier UX.
const REQUEST_COOLDOWN_STEPS_MS = [60 * 1000, 2 * 60 * 1000, 5 * 60 * 1000, 15 * 60 * 1000];
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_CODES_PER_WINDOW = 5;
const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "MaviTeam <no-reply@maviteam.com>";
const resendApiKey = defineSecret("RESEND_API_KEY");
const resendWebhookSecret = defineSecret("RESEND_WEBHOOK_SECRET");

const ATTENDANCE_RETENTION_DAYS = 14;
const ATTENDANCE_CLEANUP_BATCH_SIZE = 300;
const ATTENDANCE_STATUS_FIELDS = ["present", "absent", "late", "excused"];

function createVerificationCode() {
  return randomInt(100000, 1000000).toString();
}

function normalizeCode(value) {
  return String(value ?? "").replace(/[^0-9]/g, "").slice(0, 6);
}

function normalizeEmailAddress(value) {
  return String(value ?? "").trim().toLowerCase();
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

function getRequiredCooldownMs(requestsAlreadySentInWindow) {
  const stepIndex = Math.min(Math.max(requestsAlreadySentInWindow - 1, 0), REQUEST_COOLDOWN_STEPS_MS.length - 1);
  return REQUEST_COOLDOWN_STEPS_MS[stepIndex];
}

function getNextRateLimitState(data, nowMillis) {
  const lastRequestedAtMillis = timestampToMillis(data?.requestedAt || data?.updatedAt || data?.createdAt);
  const rateLimit = data?.rateLimit || {};
  const windowStartedAtMillis = timestampToMillis(rateLimit.windowStartedAt);
  const windowIsActive = windowStartedAtMillis > 0 && nowMillis - windowStartedAtMillis < RATE_LIMIT_WINDOW_MS;
  const currentCount = windowIsActive && typeof rateLimit.count === "number" ? rateLimit.count : 0;

  if (data?.status === "pending" && lastRequestedAtMillis > 0) {
    const requiredCooldownMs = getRequiredCooldownMs(currentCount);

    if (nowMillis - lastRequestedAtMillis < requiredCooldownMs) {
      throw new HttpsError("resource-exhausted", "Please wait before requesting another verification code.");
    }
  }

  if (!windowIsActive) {
    return {
      windowStartedAt: admin.firestore.Timestamp.fromMillis(nowMillis),
      count: 1,
    };
  }

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
  const normalizedEmail = normalizeEmailAddress(user.email);

  // Resend/SES suppress an address account-wide after a bounce or spam
  // complaint and silently drop every future send to it -- the API still
  // returns success, so without this check the function would keep
  // reporting "sent" forever with no email ever arriving. The
  // resendWebhook function below is what keeps this collection current.
  const deliveryStatusSnapshot = await db.doc(`emailDeliveryStatus/${normalizedEmail}`).get();

  if (deliveryStatusSnapshot.exists && deliveryStatusSnapshot.data()?.suppressed === true) {
    throw new HttpsError("failed-precondition", "EMAIL_SUPPRESSED");
  }

  const codeRef = db.doc(`emailVerificationCodes/${user.uid}`);
  const code = createVerificationCode();
  const nowMillis = Date.now();
  const now = admin.firestore.Timestamp.fromMillis(nowMillis);
  const expiresAt = admin.firestore.Timestamp.fromMillis(nowMillis + CODE_TTL_MS);
  const displayName = String(request.data?.fullName || user.name).trim() || "MaviTeam User";

  const nextRateLimit = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(codeRef);
    const existingData = snapshot.exists ? snapshot.data() : null;
    const rateLimit = getNextRateLimitState(existingData, nowMillis);

    // Only the cooldown/status fields are committed here. The rate-limit
    // *count* is deliberately left at its pre-request value (see below) --
    // it only advances once we know the email actually went out, so a
    // Resend outage or misconfiguration can't burn through a user's 5
    // requests/hour budget on sends that never delivered.
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
      rateLimit: existingData?.rateLimit || { windowStartedAt: now, count: 0 },
      createdAt: now,
      updatedAt: now,
    });

    return rateLimit;
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
      rateLimit: nextRateLimit,
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

// Resend suppresses an address account-wide (across every domain we send
// from) after a bounce or spam complaint, and silently drops every future
// send to it while still returning success from the API -- there is no way
// to detect this from the send call itself. This webhook is the only real
// signal, so it mirrors bounce/complaint/suppression state into Firestore;
// requestEmailVerificationCode checks emailDeliveryStatus/{email} before
// attempting a send so we can tell a user the truth instead of a false
// "sent". Configure this URL (after first deploy) as a webhook endpoint in
// the Resend dashboard, subscribed to email.bounced, email.complained,
// suppression.added, and suppression.removed, then set its signing secret
// via `firebase functions:secrets:set RESEND_WEBHOOK_SECRET`.
const SUPPRESSING_WEBHOOK_EVENTS = new Set(["email.bounced", "email.complained", "suppression.added"]);
const CLEARING_WEBHOOK_EVENTS = new Set(["suppression.removed"]);

exports.resendWebhook = onRequest({ secrets: [resendWebhookSecret] }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  let event;

  try {
    const webhook = new Webhook(resendWebhookSecret.value());
    event = webhook.verify(req.rawBody, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });
  } catch (error) {
    console.error("Resend webhook signature verification failed", error);
    res.status(400).send("Invalid signature");
    return;
  }

  const eventType = event?.type;
  const rawRecipients = event?.data?.to;
  const recipients = Array.isArray(rawRecipients) ? rawRecipients : [rawRecipients].filter(Boolean);

  if (!SUPPRESSING_WEBHOOK_EVENTS.has(eventType) && !CLEARING_WEBHOOK_EVENTS.has(eventType)) {
    res.status(200).send("Ignored");
    return;
  }

  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const suppressed = SUPPRESSING_WEBHOOK_EVENTS.has(eventType);

  await Promise.all(
    recipients.map((rawEmail) => {
      const normalizedEmail = normalizeEmailAddress(rawEmail);

      if (!normalizedEmail) {
        return null;
      }

      return db.doc(`emailDeliveryStatus/${normalizedEmail}`).set(
        {
          email: normalizedEmail,
          suppressed,
          lastEventType: eventType,
          lastEventAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    })
  );

  res.status(200).send("OK");
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

// Platform admin (superadmin) panel -- gated by a hardcoded UID allowlist,
// not a Firestore role field, so nothing any client could ever write to
// their own profile could grant them access across every club. Only used
// by the separate admin-panel web app (never bundled into the main app),
// which is the only client that ever calls these.
const PLATFORM_ADMIN_UIDS = new Set(["hXIhLZtzVvgJWrmlk8BsdLS5uP02"]);

function requirePlatformAdmin(request) {
  if (!request.auth || !PLATFORM_ADMIN_UIDS.has(request.auth.uid)) {
    throw new HttpsError("permission-denied", "Not authorized for the platform admin panel.");
  }
}

exports.getPlatformOverview = onCall(async (request) => {
  requirePlatformAdmin(request);

  const db = admin.firestore();
  const clubsSnapshot = await db.collection("clubs").get();

  const clubs = await Promise.all(
    clubsSnapshot.docs.map(async (clubSnapshot) => {
      const data = clubSnapshot.data();

      const [usersCountSnapshot, teamsCountSnapshot] = await Promise.all([
        db.collection("users").where("clubId", "==", clubSnapshot.id).count().get(),
        db.collection("teams").where("clubId", "==", clubSnapshot.id).count().get(),
      ]);

      return {
        id: clubSnapshot.id,
        name: data.name || "",
        city: data.city || "",
        sport: data.sport || "",
        status: data.status === "suspended" ? "suspended" : "active",
        createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
        memberCount: usersCountSnapshot.data().count,
        teamCount: teamsCountSnapshot.data().count,
      };
    })
  );

  clubs.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return {
    totalClubs: clubs.length,
    totalMembers: clubs.reduce((sum, club) => sum + club.memberCount, 0),
    clubs,
  };
});

exports.setClubStatus = onCall(async (request) => {
  requirePlatformAdmin(request);

  const clubId = String(request.data?.clubId || "").trim();
  const nextStatus = request.data?.status;

  if (clubId === "") {
    throw new HttpsError("invalid-argument", "clubId is required.");
  }

  if (nextStatus !== "active" && nextStatus !== "suspended") {
    throw new HttpsError("invalid-argument", "status must be 'active' or 'suspended'.");
  }

  const db = admin.firestore();
  const clubRef = db.doc(`clubs/${clubId}`);
  const clubSnapshot = await clubRef.get();

  if (!clubSnapshot.exists) {
    throw new HttpsError("not-found", "Club not found.");
  }

  const previousStatus = clubSnapshot.data()?.status === "suspended" ? "suspended" : "active";

  await clubRef.update({
    status: nextStatus,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection("adminAuditLog").add({
    action: "setClubStatus",
    clubId,
    previousStatus,
    newStatus: nextStatus,
    performedByUid: request.auth.uid,
    performedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, clubId, status: nextStatus };
});

// Deletes every doc across the club's collections in pages of
// DELETE_BATCH_SIZE (Firestore write batches cap at 500 operations).
async function deleteAllWhereClubIdEquals(db, collectionName, clubId) {
  const DELETE_BATCH_SIZE = 400;
  let totalDeleted = 0;

  for (;;) {
    const snapshot = await db.collection(collectionName).where("clubId", "==", clubId).limit(DELETE_BATCH_SIZE).get();

    if (snapshot.empty) {
      return totalDeleted;
    }

    const batch = db.batch();
    snapshot.docs.forEach((docSnapshot) => batch.delete(docSnapshot.ref));
    await batch.commit();
    totalDeleted += snapshot.size;

    if (snapshot.size < DELETE_BATCH_SIZE) {
      return totalDeleted;
    }
  }
}

// Every collection that stores a clubId field, wiped entirely when a club
// is deleted. Does NOT touch Firebase Auth accounts -- members keep their
// email/password login, they just end up with no Firestore profile at all,
// which the app already treats the same as a brand-new never-onboarded
// account (getCurrentWorkspace returns null -> routed to create/join again).
const CLUB_SCOPED_COLLECTIONS = [
  "users",
  "teams",
  "announcements",
  "scheduleEvents",
  "attendanceRecords",
  "attendanceSummaries",
  "chatGroups",
  "chatMessages",
  "payments",
  "replays",
  "joinRequests",
];

exports.deleteClub = onCall(async (request) => {
  requirePlatformAdmin(request);

  const clubId = String(request.data?.clubId || "").trim();

  if (clubId === "") {
    throw new HttpsError("invalid-argument", "clubId is required.");
  }

  const db = admin.firestore();
  const clubRef = db.doc(`clubs/${clubId}`);
  const clubSnapshot = await clubRef.get();

  if (!clubSnapshot.exists) {
    throw new HttpsError("not-found", "Club not found.");
  }

  const clubData = clubSnapshot.data();
  const deletedCounts = {};

  for (const collectionName of CLUB_SCOPED_COLLECTIONS) {
    deletedCounts[collectionName] = await deleteAllWhereClubIdEquals(db, collectionName, clubId);
  }

  if (clubData.code) {
    await db.doc(`clubCodes/${clubData.code}`).delete().catch(() => {});
  }

  await clubRef.delete();

  await db.collection("adminAuditLog").add({
    action: "deleteClub",
    clubId,
    clubName: clubData.name || "",
    deletedCounts,
    performedByUid: request.auth.uid,
    performedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, clubId, deletedCounts };
});

// Push notifications -- the first Firestore-triggered functions in this
// file (everything above is onCall/onSchedule/onRequest). Delivery is
// best-effort: a failure here must never surface to the user who sent the
// message/announcement/event, since by the time these triggers run the
// underlying write has already succeeded. Every catch below only logs.
const EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_CHUNK_SIZE = 100;
const FIRESTORE_IN_CLAUSE_LIMIT = 30;
const NOTIFICATION_BODY_MAX_LENGTH = 120;

function truncateForNotification(text) {
  const trimmed = String(text || "").trim();

  if (trimmed.length <= NOTIFICATION_BODY_MAX_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, NOTIFICATION_BODY_MAX_LENGTH - 1)}…`;
}

// Looks tokens up in chunks of FIRESTORE_IN_CLAUSE_LIMIT because Firestore's
// "in" operator caps at 30 values per query.
async function getExpoPushTokensForUsers(db, userIds) {
  const tokens = [];

  for (let i = 0; i < userIds.length; i += FIRESTORE_IN_CLAUSE_LIMIT) {
    const chunk = userIds.slice(i, i + FIRESTORE_IN_CLAUSE_LIMIT);
    const snapshot = await db
      .collection("users")
      .where(admin.firestore.FieldPath.documentId(), "in", chunk)
      .get();

    snapshot.docs.forEach((docSnapshot) => {
      const userTokens = docSnapshot.data().expoPushTokens;

      if (Array.isArray(userTokens)) {
        userTokens.forEach((token) => {
          if (typeof token === "string" && token.length > 0) {
            tokens.push(token);
          }
        });
      }
    });
  }

  return Array.from(new Set(tokens));
}

async function sendExpoPushNotifications(db, userIds, excludeUserId, payload) {
  const recipientIds = Array.from(new Set(userIds)).filter((userId) => userId !== excludeUserId);

  if (recipientIds.length === 0) {
    return;
  }

  const tokens = await getExpoPushTokensForUsers(db, recipientIds);

  if (tokens.length === 0) {
    return;
  }

  const messages = tokens.map((token) => ({ to: token, sound: "default", ...payload }));

  for (let i = 0; i < messages.length; i += EXPO_PUSH_CHUNK_SIZE) {
    const chunk = messages.slice(i, i + EXPO_PUSH_CHUNK_SIZE);

    try {
      const response = await fetch(EXPO_PUSH_API_URL, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        console.warn("[sendExpoPushNotifications] Expo push API returned", response.status, await response.text());
      }
    } catch (pushError) {
      console.warn("[sendExpoPushNotifications] Failed to reach Expo push API.", pushError);
    }
  }
}

async function getSenderDisplayName(db, senderUserId) {
  const senderSnapshot = await db.doc(`users/${senderUserId}`).get();
  return senderSnapshot.exists ? senderSnapshot.data().fullName || "Yeni mesaj" : "Yeni mesaj";
}

// Club-wide (teamId absent/null) or team-filtered active-member lookup,
// shared by announcements and schedule events. Filters teamIds in memory
// instead of an "array-contains" Firestore clause on top of the "clubId =="
// equality filter so this never needs a new composite index -- a club-scale
// user list (hundreds, not the app's whole user base) comfortably fits in
// one query either way.
async function getActiveClubOrTeamUserIds(db, clubId, teamId) {
  const snapshot = await db.collection("users").where("clubId", "==", clubId).where("status", "==", "active").get();

  return snapshot.docs
    .filter((docSnapshot) => !teamId || (docSnapshot.data().teamIds ?? []).includes(teamId))
    .map((docSnapshot) => docSnapshot.id);
}

// Pinned to europe-west1 (not the us-central1 default from
// setGlobalOptions) to stay close to the Firestore database's own region.
// The database itself is in "eur3", Firestore's Europe multi-region alias
// -- that's not a real deployable Cloud Functions location (it's made up
// of europe-west1 + europe-west4 under the hood), so europe-west1 is the
// closest actual region a Firestore trigger can be pinned to.
// Wraps a Firestore-trigger handler so an unexpected failure (e.g. a
// transient Firestore error inside getExpoPushTokensForUsers, not just the
// already-caught Expo push API failures inside sendExpoPushNotifications)
// is reported to Sentry instead of silently vanishing into Cloud Logging
// that nobody is watching. These three triggers have no caller waiting on
// them -- unlike the callable functions above, whose errors already
// surface to whoever called them -- which is what makes this class of
// failure genuinely invisible without this.
function withTriggerErrorCapture(handler) {
  return async (event) => {
    try {
      await handler(event);
    } catch (error) {
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(error);
      }

      console.warn("[withTriggerErrorCapture] Trigger handler failed:", error);
    }
  };
}

exports.onChatMessageCreated = onDocumentCreated(
  { document: "chatMessages/{messageId}", region: "europe-west1" },
  withTriggerErrorCapture(async (event) => {
    const message = event.data?.data();

    if (!message) {
      return;
    }

    const recipientIds = Array.isArray(message.directUserIds) && message.directUserIds.length > 0
      ? message.directUserIds
      : Array.isArray(message.visibleUserIds)
        ? message.visibleUserIds
        : [];

    if (recipientIds.length === 0) {
      return;
    }

    const db = admin.firestore();
    const senderName = await getSenderDisplayName(db, message.senderUserId);

    await sendExpoPushNotifications(db, recipientIds, message.senderUserId, {
      title: senderName,
      body: truncateForNotification(message.text),
      data: { route: "/messages" },
    });
  })
);

exports.onAnnouncementCreated = onDocumentCreated(
  { document: "announcements/{announcementId}", region: "europe-west1" },
  withTriggerErrorCapture(async (event) => {
    const announcement = event.data?.data();

    if (!announcement) {
      return;
    }

    const db = admin.firestore();
    const recipientIds = await getActiveClubOrTeamUserIds(db, announcement.clubId, announcement.targetTeamId ?? null);

    await sendExpoPushNotifications(db, recipientIds, announcement.createdByUserId, {
      title: announcement.title || "Yeni duyuru",
      body: truncateForNotification(announcement.message),
      data: { route: "/announcements" },
    });
  })
);

exports.onScheduleEventCreated = onDocumentCreated(
  { document: "scheduleEvents/{eventId}", region: "europe-west1" },
  withTriggerErrorCapture(async (event) => {
    const scheduleEvent = event.data?.data();

    if (!scheduleEvent) {
      return;
    }

    const db = admin.firestore();
    const recipientIds = await getActiveClubOrTeamUserIds(db, scheduleEvent.clubId, scheduleEvent.teamId ?? null);

    await sendExpoPushNotifications(db, recipientIds, scheduleEvent.createdByUserId, {
      title: "Yeni etkinlik",
      body: truncateForNotification(scheduleEvent.title),
      data: { route: "/schedule" },
    });
  })
);

// Self-service account deletion (App Store 5.1.1(v) / Play's Account
// Deletion policy both require this). Unlike deleteClub, this only erases
// the requesting user's own profile + membership footprint -- chat
// messages they sent, attendance, payments, and announcements/events they
// created are left alone. Deleting those would corrupt other members'
// shared history for the sake of one person leaving; a deleted sender
// already renders as "Bilinmeyen kullanıcı" the same way an already-
// removed member's history does today (see getSenderName in
// src/app/messages.tsx), so nothing new is needed there.
//
// The club owner is blocked from deleting their own account: clubCodes/{code}
// documents are permanently pinned to ownerId in firestore.rules with no
// fallback for other clubAdmins, and there's no ownership-transfer feature
// yet. Deleting the owner's account would leave that club's join-code
// management broken forever with no recovery path.
exports.deleteMyAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  const uid = request.auth.uid;
  const db = admin.firestore();
  const userRef = db.doc(`users/${uid}`);
  const userSnapshot = await userRef.get();

  if (!userSnapshot.exists) {
    await admin.auth().deleteUser(uid).catch(() => {});
    return { ok: true };
  }

  const userData = userSnapshot.data();
  const clubId = userData.clubId || null;

  if (clubId) {
    const clubSnapshot = await db.doc(`clubs/${clubId}`).get();

    if (clubSnapshot.exists && clubSnapshot.data().ownerId === uid) {
      throw new HttpsError(
        "failed-precondition",
        "You're the owner of this club. Transfer ownership to another admin before deleting your account -- contact support for help with this."
      );
    }

    // Teams: fetched with a single equality filter and filtered for
    // membership in memory, same simplification as
    // getActiveClubOrTeamUserIds above -- a club's team count is small
    // enough that this avoids needing a new composite index just for this
    // one cleanup step.
    const teamsSnapshot = await db.collection("teams").where("clubId", "==", clubId).get();
    const teamUpdates = teamsSnapshot.docs
      .filter((docSnapshot) => {
        const data = docSnapshot.data();
        return (data.memberIds ?? []).includes(uid) || (data.coachIds ?? []).includes(uid);
      })
      .map((docSnapshot) =>
        docSnapshot.ref.update({
          memberIds: admin.firestore.FieldValue.arrayRemove(uid),
          coachIds: admin.firestore.FieldValue.arrayRemove(uid),
        })
      );

    // chatGroups: this composite index (clubId + visibleUserIds CONTAINS)
    // already exists in firestore.indexes.json, so query it directly.
    const chatGroupsSnapshot = await db
      .collection("chatGroups")
      .where("clubId", "==", clubId)
      .where("visibleUserIds", "array-contains", uid)
      .get();
    const chatGroupUpdates = chatGroupsSnapshot.docs.map((docSnapshot) =>
      docSnapshot.ref.update({ visibleUserIds: admin.firestore.FieldValue.arrayRemove(uid) })
    );

    await Promise.all([...teamUpdates, ...chatGroupUpdates]);
  }

  // Pure equality filter on userId, no clubId scoping needed -- catches a
  // stray pending request to any club, not just their current one.
  const joinRequestsSnapshot = await db.collection("joinRequests").where("userId", "==", uid).get();
  await Promise.all(joinRequestsSnapshot.docs.map((docSnapshot) => docSnapshot.ref.delete()));

  await userRef.delete();

  // The irreversible step, last and only once everything above succeeded.
  await admin.auth().deleteUser(uid);

  return { ok: true };
});
