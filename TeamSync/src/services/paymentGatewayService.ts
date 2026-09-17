import { httpsCallable } from "firebase/functions";

import { requireFirebaseServices } from "@/lib/firebase";
import type { ClubCountry } from "@/types/teamSync";

type ConnectPaymentAccountResponse = {
  url: string | null;
};

export type ClubSignupDraft = {
  name: string;
  sport: string;
  city: string;
  country: ClubCountry;
};

// Exactly one of these two shapes comes back: a promo code redeems
// synchronously (clubId), a paid signup starts a checkout the caller must
// open and then wait on (pendingSignupId/checkoutUrl) -- see
// functions/index.js's startClubSignup and create-club.tsx's use of it.
type StartClubSignupResponse =
  | { clubId: string; pendingSignupId?: undefined; checkoutUrl?: undefined }
  | { clubId?: undefined; pendingSignupId: string; checkoutUrl: string };

type StartSubscriptionRenewalCheckoutResponse = {
  checkoutUrl: string;
};

type CancelClubSubscriptionResponse = {
  url: string;
};

// Only required (and only ever sent) for TR clubs -- iyzico has no hosted
// onboarding page, so this goes straight to the sub-merchant creation API.
// PERSONAL sub-merchant type only for now (see functions/index.js).
export type IyzicoSubMerchantInput = {
  name: string;
  contactName: string;
  contactSurname: string;
  email: string;
  gsmNumber: string;
  address: string;
  iban: string;
  identityNumber: string;
};

type CreateCheckoutSessionResponse = {
  url: string;
};

export const paymentGatewayService = {
  async connectPaymentAccount(clubId: string, iyzicoSubMerchant?: IyzicoSubMerchantInput) {
    const { functions } = requireFirebaseServices();
    const connectPaymentAccount = httpsCallable<
      { clubId: string; iyzicoSubMerchant?: IyzicoSubMerchantInput },
      ConnectPaymentAccountResponse
    >(functions, "connectPaymentAccount");

    const response = await connectPaymentAccount({ clubId, iyzicoSubMerchant });
    return response.data;
  },

  async createCheckoutSession(paymentId: string) {
    const { functions } = requireFirebaseServices();
    const createCheckoutSession = httpsCallable<{ paymentId: string }, CreateCheckoutSessionResponse>(
      functions,
      "createCheckoutSession"
    );

    const response = await createCheckoutSession({ paymentId });
    return response.data;
  },

  // Gates club creation: returns either an already-created clubId (promo
  // code redeemed synchronously) or a checkout to open and a pendingSignupId
  // to poll for completion -- see create-club.tsx.
  async startClubSignup(clubDraft: ClubSignupDraft, promoCode?: string) {
    const { functions } = requireFirebaseServices();
    const startClubSignup = httpsCallable<
      { clubDraft: ClubSignupDraft; promoCode?: string },
      StartClubSignupResponse
    >(functions, "startClubSignup");

    const response = await startClubSignup({ clubDraft, promoCode: promoCode || undefined });
    return response.data;
  },

  async startSubscriptionRenewalCheckout(clubId: string) {
    const { functions } = requireFirebaseServices();
    const startSubscriptionRenewalCheckout = httpsCallable<{ clubId: string }, StartSubscriptionRenewalCheckoutResponse>(
      functions,
      "startSubscriptionRenewalCheckout"
    );

    const response = await startSubscriptionRenewalCheckout({ clubId });
    return response.data;
  },

  async cancelClubSubscription(clubId: string) {
    const { functions } = requireFirebaseServices();
    const cancelClubSubscription = httpsCallable<{ clubId: string }, CancelClubSubscriptionResponse>(
      functions,
      "cancelClubSubscription"
    );

    const response = await cancelClubSubscription({ clubId });
    return response.data;
  },
};
