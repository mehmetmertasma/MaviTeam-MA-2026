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
  if (error instanceof Error) {
    if (error.message === "FIREBASE_CONFIG_MISSING") return "FIREBASE_CONFIG_MISSING";
    if (error.message === "AUTH_USER_MISSING") return "AUTH_USER_MISSING";
    if (error.message === "WORKSPACE_PROFILE_MISSING") return "WORKSPACE_PROFILE_MISSING";
    if (error.message === "WORKSPACE_SETUP_REQUIRED") return "WORKSPACE_SETUP_REQUIRED";
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const errorCode = (error as { code?: unknown }).code;

    if (typeof errorCode === "string") {
      return errorCode;
    }
  }

  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
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
    case "WORKSPACE_PROFILE_MISSING":
      return "Giriş başarılı ama kullanıcı profili Firestore içinde bulunamadı. Tekrar giriş yap veya hesabı yeniden oluştur.";
    case "WORKSPACE_SETUP_REQUIRED":
      return "Giriş başarılı. Bu hesap için henüz gerçek kulüp kurulumu yok.";
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
    case "permission-denied":
    case "firestore/permission-denied":
      return "Firestore izin hatası var. Firestore rules veya kullanıcı club/status alanları bu işlem için izin vermiyor.";
    case "unavailable":
    case "firestore/unavailable":
      return "Firestore bağlantısı şu anda kullanılamıyor. İnternet bağlantını kontrol edip tekrar dene.";
    case "deadline-exceeded":
    case "firestore/deadline-exceeded":
      return "Firestore isteği zaman aşımına uğradı. Biraz bekleyip tekrar dene.";
    default:
      return `Giriş sistemi hatası: ${code}`;
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
    const credential = await createUserWithEmailAndPassword(auth, normalizeEmail(input.email), input.password);
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
    await user.getIdToken(true);
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
