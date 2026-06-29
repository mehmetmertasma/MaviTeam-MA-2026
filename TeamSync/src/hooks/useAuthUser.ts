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
      setUser(nextUser);
      setIsAuthReady(true);
    });
  }, [isFirebaseAuthConfigured]);

  return {
    user,
    isAuthReady,
    isFirebaseAuthConfigured,
  };
}
