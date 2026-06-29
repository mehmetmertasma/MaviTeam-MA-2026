import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
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
