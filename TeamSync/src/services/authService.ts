import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import type { User } from "firebase/auth";

import { getFirebaseServices, isFirebaseConfigured } from "@/lib/firebase";

type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getAuthOrThrow() {
  const services = getFirebaseServices();

  if (services === null) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  return services.auth;
}

function getCurrentUserOrThrow() {
  const auth = getAuthOrThrow();

  if (auth.currentUser === null) {
    throw new Error("AUTH_USER_MISSING");
  }

  return auth.currentUser;
}

function getErrorCode(error: unknown) {
  if (error instanceof Error && error.message === "FIREBASE_CONFIG_MISSING") {
    return "FIREBASE_CONFIG_MISSING";
  }

  if (error instanceof Error && error.message === "AUTH_USER_MISSING") {
    return "AUTH_USER_MISSING";
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const errorCode = (error as { code?: unknown }).code;

    if (typeof errorCode === "string") {
      return errorCode;
    }
  }

  return "UNKNOWN_AUTH_ERROR";
}

export function getAuthErrorMessage(error: unknown) {
  const code = getErrorCode(error);

  switch (code) {
    case "FIREBASE_CONFIG_MISSING":
      return "Firebase ayarları eksik. Gerçek giriş için .env dosyasına Firebase bilgilerini ekleyip uygulamayı yeniden başlat.";
    case "AUTH_USER_MISSING":
      return "Oturum bulunamadı. Lütfen tekrar giriş yap.";
    case "auth/invalid-email":
      return "Lütfen geçerli bir e-posta adresi gir.";
    case "auth/user-disabled":
      return "Bu hesap devre dışı bırakılmış.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "E-posta veya şifre hatalı. Bilgilerini kontrol edip tekrar dene.";
    case "auth/email-already-in-use":
      return "Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyebilirsin.";
    case "auth/weak-password":
      return "Şifre en az 6 karakter olmalı.";
    case "auth/network-request-failed":
      return "Ağ bağlantısı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.";
    case "auth/too-many-requests":
      return "Çok fazla deneme yapıldı. Bir süre bekleyip tekrar dene.";
    default:
      return "Giriş sistemiyle ilgili beklenmeyen bir sorun oluştu. Lütfen tekrar dene.";
  }
}

export const authService = {
  isConfigured() {
    return isFirebaseConfigured;
  },

  getCurrentUser() {
    const services = getFirebaseServices();
    return services?.auth.currentUser ?? null;
  },

  onUserChanged(callback: (user: User | null) => void) {
    const services = getFirebaseServices();

    if (services === null) {
      callback(null);
      return () => undefined;
    }

    return onAuthStateChanged(services.auth, callback);
  },

  async registerWithEmail(input: RegisterInput) {
    const auth = getAuthOrThrow();
    const credential = await createUserWithEmailAndPassword(
      auth,
      normalizeEmail(input.email),
      input.password
    );

    const cleanName = input.fullName.trim();

    if (cleanName !== "") {
      await updateProfile(credential.user, { displayName: cleanName });
    }

    return credential.user;
  },

  async loginWithEmail(input: LoginInput) {
    const auth = getAuthOrThrow();
    const credential = await signInWithEmailAndPassword(auth, normalizeEmail(input.email), input.password);
    return credential.user;
  },

  async refreshCurrentUser() {
    const user = getCurrentUserOrThrow();
    await reload(user);
    return getCurrentUserOrThrow();
  },

  async sendVerificationEmail() {
    return Promise.resolve();
  },

  async logout() {
    const auth = getAuthOrThrow();
    await signOut(auth);
  },

  async sendPasswordReset(email: string) {
    const auth = getAuthOrThrow();
    await sendPasswordResetEmail(auth, normalizeEmail(email));
  },
};

export type AuthService = typeof authService;
