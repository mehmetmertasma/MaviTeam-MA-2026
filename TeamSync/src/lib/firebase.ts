import { getApp, getApps, initializeApp } from "firebase/app";
import type { FirebaseApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import type { Functions } from "firebase/functions";
import { getStorage } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
};

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  functions: Functions;
  storage: FirebaseStorage;
};

function hasRequiredFirebaseConfig(config: FirebaseOptions) {
  return Boolean(
    config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.storageBucket &&
      config.messagingSenderId &&
      config.appId
  );
}

function createFirestore(app: FirebaseApp) {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true,
    });
  } catch {
    return getFirestore(app);
  }
}

export const isFirebaseConfigured = hasRequiredFirebaseConfig(firebaseConfig);

let cachedServices: FirebaseServices | null = null;

export function getFirebaseServices() {
  if (!isFirebaseConfigured) {
    return null;
  }

  if (cachedServices !== null) {
    return cachedServices;
  }

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  cachedServices = {
    app,
    auth: getAuth(app),
    db: createFirestore(app),
    functions: getFunctions(app, "us-central1"),
    storage: getStorage(app),
  };

  return cachedServices;
}

export function requireFirebaseServices() {
  const services = getFirebaseServices();

  if (services === null) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  return services;
}

export const firebaseServices = getFirebaseServices();
export const firebaseApp = firebaseServices?.app ?? null;
export const firebaseAuth = firebaseServices?.auth ?? null;
export const firestoreDb = firebaseServices?.db ?? null;
export const firebaseFunctions = firebaseServices?.functions ?? null;
export const firebaseStorage = firebaseServices?.storage ?? null;
