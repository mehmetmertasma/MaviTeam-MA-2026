import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";

initializeApp();

const REGION = "us-central1";
const CODE_TTL_MS = 10 * 60 * 1000;
const MIN_RESEND_MS = 60 * 1000;
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

function hashCode(uid: string, email: string, code: string) {
  return createHash("sha256").update(`${uid}:${email.toLowerCase()}:${code}:${requiredEnv("VERIFICATION_CODE_PEPPER")}`).digest("hex");
}

function compareHash(a: string, b: string) {
  const bufferA = Buffer.from(a, "hex");
  const bufferB = Buffer.from(b, "hex");
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

async function sendCodeEmail(email: string, code: string) {
  console.log(`MaviTeam verification code for ${email}: ${code}`);
}

export const sendEmailVerificationCode = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Giriş yapmalısın.");

  const userRecord = await getAuth().getUser(uid);
  if (userRecord.emailVerified) return { alreadyVerified: true, sent: false };

  const email = userRecord.email;
  if (!email) throw new HttpsError("failed-precondition", "E-posta adresi bulunamadı.");

  const db = getFirestore();
  const codeRef = db.collection(CODE_COLLECTION).doc(uid);
  const previousCode = await codeRef.get();
  const lastSentAt = previousCode.get("lastSentAt") as Timestamp | undefined;

  if (lastSentAt && Date.now() - lastSentAt.toMillis() < MIN_RESEND_MS) {
    throw new HttpsError("resource-exhausted", "Yeni kod istemeden önce 60 saniye bekle.");
  }

  const code = createCode();
  await codeRef.set(
    {
      attempts: 0,
      codeHash: hashCode(uid, email, code),
      email,
      expiresAt: Timestamp.fromMillis(Date.now() + CODE_TTL_MS),
      lastSentAt: FieldValue.serverTimestamp(),
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
  if (!uid) throw new HttpsError("unauthenticated", "Giriş yapmalısın.");
  if (!/^\d{6}$/.test(code)) throw new HttpsError("invalid-argument", "6 haneli kod gir.");

  const db = getFirestore();
  const codeRef = db.collection(CODE_COLLECTION).doc(uid);
  const snapshot = await codeRef.get();
  if (!snapshot.exists) throw new HttpsError("not-found", "Aktif kod bulunamadı.");

  const data = snapshot.data();
  const email = typeof data?.email === "string" ? data.email : "";
  const codeHash = typeof data?.codeHash === "string" ? data.codeHash : "";
  const attempts = typeof data?.attempts === "number" ? data.attempts : 0;
  const expiresAt = data?.expiresAt as Timestamp | undefined;

  if (!email || !codeHash || !expiresAt) {
    await codeRef.delete();
    throw new HttpsError("failed-precondition", "Kod kaydı bozuk. Yeni kod iste.");
  }
  if (expiresAt.toMillis() < Date.now()) {
    await codeRef.delete();
    throw new HttpsError("deadline-exceeded", "Kodun süresi doldu. Yeni kod iste.");
  }
  if (attempts >= MAX_ATTEMPTS) {
    await codeRef.delete();
    throw new HttpsError("resource-exhausted", "Çok fazla deneme. Yeni kod iste.");
  }
  if (!compareHash(codeHash, hashCode(uid, email, code))) {
    await codeRef.set({ attempts: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    throw new HttpsError("permission-denied", "Kod hatalı.");
  }

  await getAuth().updateUser(uid, { emailVerified: true });
  await db.collection("users").doc(uid).set(
    { email, emailVerifiedAt: FieldValue.serverTimestamp(), emailVerifiedByCode: true, status: "emailVerified", updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
  await codeRef.delete();

  return { verified: true };
});
