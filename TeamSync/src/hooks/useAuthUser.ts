import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

import { authService } from "@/services/authService";

type AuthUserState = {
  user: User | null;
  isAuthReady: boolean;
  isFirebaseAuthConfigured: boolean;
};

export function useAuthUser(): AuthUserState {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isAuthReady, setIsAuthReady] = useState(!authService.isConfigured());

  useEffect(() => {
    if (!authService.isConfigured()) {
      setUser(null);
      setIsAuthReady(true);
      return;
    }

    const unsubscribe = authService.onUserChanged((nextUser) => {
      setUser(nextUser);
      setIsAuthReady(true);
    });

    return unsubscribe;
  }, []);

  return {
    user,
    isAuthReady,
    isFirebaseAuthConfigured: authService.isConfigured(),
  };
}
