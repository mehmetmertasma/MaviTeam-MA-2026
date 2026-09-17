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
import { withNetworkRetry } from "@/utils/retry";

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
    if (error.message === "CLUB_CODE_ALREADY_EXISTS") return "CLUB_CODE_ALREADY_EXISTS";
    if (error.message === "CLUB_CODE_REQUIRED") return "CLUB_CODE_REQUIRED";
    if (error.message === "EMAIL_SUPPRESSED") return "EMAIL_SUPPRESSED";
    // startClubSignup's own error strings -- checked first, same as the
    // club-code cases above, so they don't fall through to the generic
    // functions/not-found / functions/failed-precondition messages below,
    // which are worded for the (unrelated) email-verification flow.
    if (error.message === "PROMO_CODE_NOT_FOUND") return "PROMO_CODE_NOT_FOUND";
    if (error.message === "PROMO_CODE_ALREADY_USED") return "PROMO_CODE_ALREADY_USED";
    if (error.message === "TR_SUBSCRIPTIONS_NOT_YET_AVAILABLE") return "TR_SUBSCRIPTIONS_NOT_YET_AVAILABLE";
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

export function getAuthErrorMessage(error: unknown, language: "tr" | "en" = "tr") {
  const code = getErrorCode(error);
  const en = language === "en";

  switch (code) {
    case "FIREBASE_CONFIG_MISSING":
      return en ? "Couldn't connect to the server. Please try again in a moment." : "Sunucuya bağlanılamadı. Lütfen birazdan tekrar dene.";
    case "AUTH_USER_MISSING":
      return en ? "Your session has expired. Please sign in again." : "Oturum bulunamadı. Lütfen tekrar giriş yap.";
    case "WORKSPACE_PROFILE_MISSING":
      return en
        ? "You're signed in, but we couldn't find your account profile. Try signing in again or recreate your account."
        : "Giriş başarılı ama hesabına ait profil bulunamadı. Tekrar giriş yap veya hesabı yeniden oluştur.";
    case "WORKSPACE_SETUP_REQUIRED":
      return en ? "You're signed in. This account doesn't have a club set up yet." : "Giriş başarılı. Bu hesap için henüz bir kulüp kurulumu yok.";
    case "CLUB_CODE_ALREADY_EXISTS":
      return en ? "That club code is already taken. Adjust the club name slightly and try again." : "Bu kulüp kodu zaten kullanılıyor. Kulüp adını biraz değiştirip tekrar dene.";
    case "CLUB_CODE_REQUIRED":
      return en ? "Couldn't generate a club code. Check the club name and try again." : "Kulüp kodu oluşturulamadı. Kulüp adını kontrol edip tekrar dene.";
    case "EMAIL_SUPPRESSED":
      return en
        ? "We can't send a verification code to this email address right now. Try a different address or contact us."
        : "Bu email adresine doğrulama kodu gönderilemiyor. Farklı bir email adresi dene ya da bizimle iletişime geç.";
    case "PROMO_CODE_NOT_FOUND":
      return en ? "That promo code was not found. Check it and try again." : "Bu promosyon kodu bulunamadı. Kontrol edip tekrar dene.";
    case "PROMO_CODE_ALREADY_USED":
      return en ? "That promo code has already been used." : "Bu promosyon kodu daha önce kullanılmış.";
    case "TR_SUBSCRIPTIONS_NOT_YET_AVAILABLE":
      return en
        ? "Online subscriptions for Turkey-based clubs aren't available yet. Ask us for a promo code in the meantime."
        : "Türkiye'deki kulüpler için online abonelik henüz aktif değil. Bu süre için bizden bir promosyon kodu isteyebilirsiniz.";
    case "FIRESTORE_WORKSPACE_MISSING":
      return en ? "Couldn't load your club workspace. Refresh your session and try again." : "Kulüp çalışma alanı yüklenemedi. Oturumunu yenileyip tekrar dene.";
    case "TEAM_PERMISSION_DENIED":
      return en ? "You need club admin access to create a team." : "Takım oluşturmak için kulüp admin yetkisi gerekiyor.";
    case "TEAM_REQUIRED_FIELDS_MISSING":
      return en ? "The team name can't be empty." : "Takım adı boş bırakılamaz.";
    case "auth/invalid-email":
      return en ? "Please enter a valid email address." : "Lütfen geçerli bir e-posta adresi gir.";
    case "auth/user-disabled":
      return en ? "This account has been disabled." : "Bu hesap devre dışı bırakılmış.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return en ? "Incorrect email or password. Check your details and try again." : "E-posta veya şifre hatalı. Bilgilerini kontrol edip tekrar dene.";
    case "auth/email-already-in-use":
      return en ? "An account already exists with this email. Try signing in instead." : "Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyebilirsin.";
    case "auth/weak-password":
      return en ? "Password must be at least 6 characters." : "Şifre en az 6 karakter olmalı.";
    case "auth/network-request-failed":
      return en ? "Couldn't connect to the network. Check your connection and try again." : "Ağ bağlantısı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.";
    case "auth/too-many-requests":
      return en ? "Too many attempts. Please wait a moment and try again." : "Çok fazla deneme yapıldı. Bir süre bekleyip tekrar dene.";
    case "functions/resource-exhausted":
    case "resource-exhausted":
      return en ? "Too many verification codes were requested. Wait a bit and try again." : "Çok fazla doğrulama kodu istendi. Biraz bekleyip tekrar dene.";
    case "functions/failed-precondition":
    case "failed-precondition":
      return en ? "The email verification service isn't ready yet. Please try again later." : "E-posta doğrulama servisi henüz hazır değil. Lütfen daha sonra tekrar dene.";
    case "functions/internal":
    case "internal":
      return en ? "Couldn't send the verification email. Wait a bit and try again." : "Doğrulama emaili gönderilemedi. Biraz bekleyip tekrar dene.";
    case "functions/invalid-argument":
    case "invalid-argument":
      return en ? "That verification code is invalid or incomplete. Check the 6-digit code." : "Doğrulama kodu hatalı veya eksik. 6 haneli kodu kontrol et.";
    case "functions/not-found":
    case "not-found":
      return en ? "No active verification code was found. Request a new one." : "Aktif doğrulama kodu bulunamadı. Yeni kod iste.";
    case "functions/deadline-exceeded":
      return en ? "That verification code has expired. Request a new one." : "Doğrulama kodunun süresi doldu. Yeni kod iste.";
    case "functions/permission-denied":
      return en ? "That verification code doesn't belong to this account. Check your account and try again." : "Bu doğrulama kodu bu hesaba ait değil. Hesabını kontrol edip tekrar dene.";
    case "functions/unauthenticated":
      return en ? "Please sign in again to continue verification." : "Doğrulama için tekrar giriş yapman gerekiyor.";
    case "permission-denied":
    case "firestore/permission-denied":
      return en ? "You don't have permission to do this." : "Bu işlem için yetkin yok.";
    case "unavailable":
    case "firestore/unavailable":
      return en ? "The service is temporarily unavailable. Check your connection and try again." : "Servis şu anda kullanılamıyor. İnternet bağlantını kontrol edip tekrar dene.";
    case "deadline-exceeded":
    case "firestore/deadline-exceeded":
      return en ? "The request timed out. Wait a moment and try again." : "İstek zaman aşımına uğradı. Biraz bekleyip tekrar dene.";
    default:
      return en ? "Something went wrong. Please try again." : "Beklenmeyen bir hata oluştu. Lütfen tekrar dene.";
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
    const credential = await withNetworkRetry(() =>
      createUserWithEmailAndPassword(auth, normalizeEmail(input.email), input.password)
    );
    const cleanName = input.fullName.trim();

    if (cleanName !== "") {
      await updateProfile(credential.user, { displayName: cleanName });
    }

    return credential.user;
  },

  async loginWithEmail(input: LoginInput) {
    const auth = getAuthOrThrow();
    const credential = await withNetworkRetry(() =>
      signInWithEmailAndPassword(auth, normalizeEmail(input.email), input.password)
    );
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
    await withNetworkRetry(() => sendPasswordResetEmail(auth, normalizeEmail(email)));
  },
};

export type AuthService = typeof authService;
