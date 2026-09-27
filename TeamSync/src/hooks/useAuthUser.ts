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

      // Set user and ready state immediately to prevent blocking initial UI render
      setUser(nextUser);
      setIsAuthReady(true);

      // Refresh ID token in background to pick up latest custom claims without delaying UI
      nextUser
        .getIdToken(true)
        .then(() => {
          setUser(authService.getCurrentUser());
        })
        .catch(() => undefined);
    });
  }, [isFirebaseAuthConfigured]);

  return {
    user,
    isAuthReady,
    isFirebaseAuthConfigured,
  };
}
