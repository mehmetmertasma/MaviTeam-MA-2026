import { httpsCallable } from "firebase/functions";

import { requireFirebaseServices } from "@/lib/firebase";

type DeleteMyAccountResponse = {
  ok: boolean;
};

export const accountDeletionService = {
  async deleteMyAccount() {
    const { functions } = requireFirebaseServices();
    const deleteMyAccount = httpsCallable<Record<string, never>, DeleteMyAccountResponse>(
      functions,
      "deleteMyAccount"
    );

    const response = await deleteMyAccount({});
    return response.data;
  },
};
