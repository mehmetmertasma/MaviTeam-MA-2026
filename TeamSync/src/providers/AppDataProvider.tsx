import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import { useAuthContext } from "@/providers/AuthProvider";
import { useAppData } from "@/hooks/useAppData";
import type { TeamSyncAppData } from "@/types/teamSync";

type AppDataContextValue = {
  appData: TeamSyncAppData | null;
  isLoading: boolean;
  error: unknown;
  refresh: () => Promise<TeamSyncAppData>;
  setAppData: (nextAppData: TeamSyncAppData) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

type AppDataProviderProps = {
  children: ReactNode;
};

export function AppDataProvider({ children }: AppDataProviderProps) {
  const { isAuthReady, user } = useAuthContext();
  const appDataState = useAppData(isAuthReady, user?.uid ?? "anonymous");

  const value = useMemo(() => appDataState, [appDataState]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppDataContext() {
  const value = useContext(AppDataContext);

  if (value === null) {
    throw new Error("useAppDataContext must be used inside AppDataProvider");
  }

  return value;
}
