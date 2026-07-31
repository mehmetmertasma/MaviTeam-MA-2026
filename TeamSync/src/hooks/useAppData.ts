import { useCallback, useEffect, useRef, useState } from "react";

import { teamSyncService } from "@/services/teamSyncService";
import type { TeamSyncAppData } from "@/types/teamSync";

type AppDataState = {
  appData: TeamSyncAppData | null;
  isLoading: boolean;
  error: unknown;
};

const initialState: AppDataState = { appData: null, isLoading: true, error: null };

// Centralizes what used to be a `teamSyncService.getAppData()` call repeated
// independently in the root layout, the global nav bar, and every screen —
// each of those triggered its own full ~12-request Firestore fetch on every
// navigation. This hook fetches once and shares the result; callers that
// already have fresh data (e.g. a mutation's return value) can write it
// straight into state via `setAppData` instead of forcing a refetch.
//
// `identityKey` must change whenever the signed-in account changes (e.g. a
// logout followed by a different account logging back in within the same
// session) so this refetches instead of leaving the previous account's data
// sitting in the shared cache — `enabled` alone only tells us auth has
// resolved at least once, not that the account underneath it changed.
export function useAppData(enabled: boolean, identityKey: string) {
  const [state, setState] = useState<AppDataState>(initialState);
  const isMountedRef = useRef(true);
  const inFlightRef = useRef<Promise<TeamSyncAppData> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (inFlightRef.current !== null) {
      return inFlightRef.current;
    }

    const request = teamSyncService.getAppData();
    inFlightRef.current = request;

    try {
      const nextAppData = await request;

      if (isMountedRef.current) {
        setState({ appData: nextAppData, isLoading: false, error: null });
      }

      return nextAppData;
    } catch (error) {
      if (isMountedRef.current) {
        setState((current) => ({ ...current, isLoading: false, error }));
      }

      throw error;
    } finally {
      inFlightRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState(initialState);
      return;
    }

    setState((current) => ({ ...current, isLoading: true }));
    load().catch(() => {});
  }, [enabled, identityKey, load]);

  const refresh = useCallback(() => load(), [load]);

  const setAppData = useCallback((nextAppData: TeamSyncAppData) => {
    setState({ appData: nextAppData, isLoading: false, error: null });
  }, []);

  return {
    appData: state.appData,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
    setAppData,
  };
}
