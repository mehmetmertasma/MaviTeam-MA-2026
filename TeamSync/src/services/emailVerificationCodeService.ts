import { httpsCallable } from "firebase/functions";

import { requireFirebaseServices } from "@/lib/firebase";

type SendCodeResponse = {
  alreadyVerified?: boolean;
  expiresInSeconds?: number;
  sent: boolean;
};

type VerifyCodeResponse = {
  verified: boolean;
};

function functions() {
  return requireFirebaseServices().functions;
}

function messageFrom(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim() !== "") return message;
  }

  return "Doğrulama kodu işlemi tamamlanamadı. Lütfen tekrar dene.";
}

export const emailVerificationCodeService = {
  async sendCode() {
    try {
      const call = httpsCallable<void, SendCodeResponse>(functions(), "sendEmailVerificationCode");
      const result = await call();
      return result.data;
    } catch (error) {
      throw new Error(messageFrom(error));
    }
  },

  async verifyCode(code: string) {
    try {
      const call = httpsCallable<{ code: string }, VerifyCodeResponse>(functions(), "verifyEmailCode");
      const result = await call({ code });
      return result.data;
    } catch (error) {
      throw new Error(messageFrom(error));
    }
  },
};
