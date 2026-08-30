import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";

import { authService } from "@/services/authService";

type AuthUserState = {
  user: User | null;
  isAuthReady: boolean;
  isFirebaseAuthConfigured: boolean;
};

export function useAuthUser(): AuthUserState {
  const isFirebaseAuthConfigured = useMemo(() => authService.isConfigured(), []);
  const [user, setUser] = useState<User | null>(() => (
    isFirebaseAuthConfigured ? authService.getCurrentUser() : null
  ));
  const [isAuthReady, setIsAuthReady] = useState(!isFirebaseAuthConfigured);

  useEffect(() => {
    if (!isFirebaseAuthConfigured) {
      return;
    }

    return authService.onUserChanged((nextUser) => {
      if (nextUser === null) {
        setUser(nextUser);
        setIsAuthReady(true);
        return;
      }

      // A rehydrated/persisted session can carry an ID token minted before
      // an email-verification (or role/status change) happened elsewhere --
      // that token stays valid for up to an hour and the SDK won't refresh
      // it on its own, so every Firestore read gated by verifiedEmail() in
      // firestore.rules would keep failing with a stale "not verified"
      // claim even though Auth and Firestore both already agree the account
      // is verified. Forcing a refresh once per new sign-in/session start
      // (not on every render) means the rest of the app never reads
      // Firestore with a token older than this.
      nextUser
        .getIdToken(true)
        .catch(() => undefined)
        .finally(() => {
          setUser(nextUser);
          setIsAuthReady(true);
        });
    });
  }, [isFirebaseAuthConfigured]);

  return {
    user,
    isAuthReady,
    isFirebaseAuthConfigured,
  };
}
