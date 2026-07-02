import { getApp, getApps, initializeApp } from "firebase/app";
import type { FirebaseApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";

type FirebaseConfigKey = keyof Pick<
  FirebaseOptions,
  "apiKey" | "authDomain" | "projectId" | "storageBucket" | "messagingSenderId" | "appId"
>;

type FirebaseConfigField = {
  envName: string;
  configKey: FirebaseConfigKey;
  value: string;
};

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
};

const firebaseConfigFields: FirebaseConfigField[] = [
  {
    envName: "EXPO_PUBLIC_FIREBASE_API_KEY",
    configKey: "apiKey",
    value: firebaseConfig.apiKey ?? "",
  },
  {
    envName: "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
    configKey: "authDomain",
    value: firebaseConfig.authDomain ?? "",
  },
  {
    envName: "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
    configKey: "projectId",
    value: firebaseConfig.projectId ?? "",
  },
  {
    envName: "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
    configKey: "storageBucket",
    value: firebaseConfig.storageBucket ?? "",
  },
  {
    envName: "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    configKey: "messagingSenderId",
    value: firebaseConfig.messagingSenderId ?? "",
  },
  {
    envName: "EXPO_PUBLIC_FIREBASE_APP_ID",
    configKey: "appId",
    value: firebaseConfig.appId ?? "",
  },
];

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
};

function isMissingOrPlaceholder(value: string) {
  const cleanValue = value.trim();

  return cleanValue === "" || cleanValue.toLowerCase().startsWith("replace_with");
}

export function getMissingFirebaseConfigKeys() {
  return firebaseConfigFields
    .filter((field) => isMissingOrPlaceholder(field.value))
    .map((field) => field.envName);
}

export function getFirebaseConfigStatusMessage() {
  const missingKeys = getMissingFirebaseConfigKeys();

  if (missingKeys.length === 0) {
    return "Firebase Auth hazır. E-posta doğrulanmış hesap ile devam edebilirsin.";
  }

  return `Firebase ayarları eksik. TeamSync/.env dosyasında şu değerleri doldur: ${missingKeys.join(", ")}. Sonra Expo'yu Ctrl+C ile kapatıp npx expo start -c ile yeniden başlat.`;
}

export const isFirebaseConfigured = getMissingFirebaseConfigKeys().length === 0;

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
    db: getFirestore(app),
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
export const firebaseStorage = firebaseServices?.storage ?? null;
