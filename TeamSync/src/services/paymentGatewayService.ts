import { httpsCallable } from "firebase/functions";

import { requireFirebaseServices } from "@/lib/firebase";

type ConnectPaymentAccountResponse = {
  url: string | null;
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
};
