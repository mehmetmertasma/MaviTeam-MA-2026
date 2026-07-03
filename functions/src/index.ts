import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";

initializeApp();

const REGION = "us-central1";
const CODE_TTL_MS = 10 * 60 * 1000;
const MIN_RESEND_MS = 60 * 1000;
const FAILED_ATTEMPT_COOLDOWN_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const CODE_COLLECTION = "emailVerificationCodes";

function createCode() {
  return randomInt(100000, 1000000).toString();
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new HttpsError("failed-precondition", `${name} is not configured.`);
  return value;
}

function fromEmail() {
  return process.env.MAVITEAM_FROM_EMAIL?.trim() || "MaviTeam <onboarding@resend.dev>";
}

function hashCode(uid: string, email: string, code: string) {
  return createHash("sha256").update(`${uid}:${email.toLowerCase()}:${code}:${requiredEnv("VERIFICATION_CODE_PEPPER")}`).digest("hex");
}

function compareHash(a: string, b: string) {
  const bufferA = Buffer.from(a, "hex");
  const bufferB = Buffer.from(b, "hex");
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

function remainingMinutes(until: Timestamp) {
  return Math.max(1, Math.ceil((until.toMillis() - Date.now()) / 60000));
}

function assertNotLocked(lockoutUntil: Timestamp | undefined) {
  if (lockoutUntil && lockoutUntil.toMillis() > Date.now()) {
    throw new HttpsError("resource-exhausted", `Too many failed attempts. Try again in about ${remainingMinutes(lockoutUntil)} minutes.`);
  }
}

function emailHtml(code: string) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:32px;color:#0f172a">
      <div style="max-width:520px;margin:0 auto;background:white;border:1px solid #e2e8f0;border-radius:16px;padding:32px">
        <h1 style="margin:0 0 12px;color:#2563eb">Verify your MaviTeam account</h1>
        <p style="font-size:16px;line-height:24px;color:#475569">Use this verification code to finish setting up your MaviTeam account.</p>
        <div style="font-size:36px;font-weight:800;letter-spacing:8px;text-align:center;padding:18px 16px;background:#eff6ff;border-radius:12px;color:#1d4ed8;margin:28px 0">${code}</div>
        <p style="font-size:14px;line-height:22px;color:#64748b">This code expires in 10 minutes. If you did not create a MaviTeam account, you can safely ignore this email.</p>
        <p style="font-size:14px;color:#64748b;margin-top:28px">The MaviTeam Team</p>
      </div>
    </div>
  `;
}

async function sendCodeEmail(email: string, code: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requiredEnv("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail(),
      to: [email],
      subject: `Your MaviTeam verification code: ${code}`,
      html: emailHtml(code),
      text: `Your MaviTeam verification code is ${code}. This code expires in 10 minutes.`,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    logger.error("MaviTeam verification email failed", { details, status: response.status });
    throw new HttpsError("internal", "Verification email could not be sent. Please try again.");
  }
}

export const sendEmailVerificationCode = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "You must be signed in.");

  const userRecord = await getAuth().getUser(uid);
  if (userRecord.emailVerified) return { alreadyVerified: true, sent: false };

  const email = userRecord.email;
  if (!email) throw new HttpsError("failed-precondition", "Email address is missing.");

  const db = getFirestore();
  const codeRef = db.collection(CODE_COLLECTION).doc(uid);
  const previousCode = await codeRef.get();
  const lastSentAt = previousCode.get("lastSentAt") as Timestamp | undefined;
  const lockoutUntil = previousCode.get("lockoutUntil") as Timestamp | undefined;

  assertNotLocked(lockoutUntil);

  if (lastSentAt && Date.now() - lastSentAt.toMillis() < MIN_RESEND_MS) {
    throw new HttpsError("resource-exhausted", "Wait 60 seconds before requesting a new code.");
  }

  const code = createCode();
  await codeRef.set(
    {
      attempts: 0,
      codeHash: hashCode(uid, email, code),
      email,
      expiresAt: Timestamp.fromMillis(Date.now() + CODE_TTL_MS),
      lastSentAt: FieldValue.serverTimestamp(),
      lockoutUntil: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
      uid,
    },
    { merge: true }
  );

  await sendCodeEmail(email, code);
  return { expiresInSeconds: CODE_TTL_MS / 1000, sent: true };
});

export const verifyEmailCode = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  const code = typeof request.data?.code === "string" ? request.data.code.trim() : "";
  if (!uid) throw new HttpsError("unauthenticated", "You must be signed in.");
  if (!/^\d{6}$/.test(code)) throw new HttpsError("invalid-argument", "Enter a 6 digit code.");

  const db = getFirestore();
  const codeRef = db.collection(CODE_COLLECTION).doc(uid);
  const snapshot = await codeRef.get();
  if (!snapshot.exists) throw new HttpsError("not-found", "No active code found. Request a new code.");

  const data = snapshot.data();
  const email = typeof data?.email === "string" ? data.email : "";
  const codeHash = typeof data?.codeHash === "string" ? data.codeHash : "";
  const attempts = typeof data?.attempts === "number" ? data.attempts : 0;
  const expiresAt = data?.expiresAt as Timestamp | undefined;
  const lockoutUntil = data?.lockoutUntil as Timestamp | undefined;

  assertNotLocked(lockoutUntil);

  if (!email || !codeHash || !expiresAt) {
    await codeRef.delete();
    throw new HttpsError("failed-precondition", "Code record is invalid. Request a new code.");
  }
  if (expiresAt.toMillis() < Date.now()) {
    await codeRef.delete();
    throw new HttpsError("deadline-exceeded", "Code expired. Request a new code.");
  }

  if (!compareHash(codeHash, hashCode(uid, email, code))) {
    const nextAttempts = attempts + 1;
    if (nextAttempts >= MAX_ATTEMPTS) {
      const nextLockoutUntil = Timestamp.fromMillis(Date.now() + FAILED_ATTEMPT_COOLDOWN_MS);
      await codeRef.set(
        {
          attempts: nextAttempts,
          codeHash: FieldValue.delete(),
          expiresAt: FieldValue.delete(),
          lockoutUntil: nextLockoutUntil,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      throw new HttpsError("resource-exhausted", `Too many failed attempts. Try again in about ${remainingMinutes(nextLockoutUntil)} minutes.`);
    }

    await codeRef.set({ attempts: nextAttempts, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    throw new HttpsError("permission-denied", `Wrong code. Attempts left: ${MAX_ATTEMPTS - nextAttempts}.`);
  }

  await getAuth().updateUser(uid, { emailVerified: true });
  await db.collection("users").doc(uid).set(
    { email, emailVerifiedAt: FieldValue.serverTimestamp(), emailVerifiedByCode: true, status: "emailVerified", updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
  await codeRef.delete();

  return { verified: true };
});
