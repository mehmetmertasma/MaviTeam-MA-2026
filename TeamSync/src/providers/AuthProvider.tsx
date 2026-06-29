import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { User } from "firebase/auth";

import { useAuthUser } from "@/hooks/useAuthUser";

type AuthContextValue = {
  user: User | null;
  isAuthReady: boolean;
  isFirebaseAuthConfigured: boolean;
  isSignedIn: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const authUser = useAuthUser();

  return (
    <AuthContext.Provider
      value={{
        ...authUser,
        isSignedIn: authUser.user !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const value = useContext(AuthContext);

  if (value === null) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }

  return value;
}
