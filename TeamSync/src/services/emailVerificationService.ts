import { httpsCallable } from "firebase/functions";

import { requireFirebaseServices } from "@/lib/firebase";

type RequestEmailVerificationCodeInput = {
  fullName: string;
};

type RequestEmailVerificationCodeResponse = {
  ok: boolean;
  expiresAt: string;
  devCode?: string;
};

type VerifyEmailCodeResponse = {
  ok: boolean;
};

function normalizeCode(code: string) {
  return code.replace(/[^0-9]/g, "").slice(0, 6);
}

export const emailVerificationService = {
  async requestCode(input: RequestEmailVerificationCodeInput) {
    const { functions } = requireFirebaseServices();
    const requestEmailVerificationCode = httpsCallable<
      RequestEmailVerificationCodeInput,
      RequestEmailVerificationCodeResponse
    >(functions, "requestEmailVerificationCode");

    const response = await requestEmailVerificationCode({
      fullName: input.fullName.trim(),
    });

    return response.data;
  },

  async verifyCode(code: string) {
    const { functions } = requireFirebaseServices();
    const verifyEmailCode = httpsCallable<{ code: string }, VerifyEmailCodeResponse>(
      functions,
      "verifyEmailCode"
    );

    const response = await verifyEmailCode({ code: normalizeCode(code) });
    return response.data;
  },
};
