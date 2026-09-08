import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

import { teamSyncService } from "@/services/teamSyncService";
import type { TeamSyncAppData } from "@/types/teamSync";

type AppDataState = {
  appData: TeamSyncAppData | null;
  isLoading: boolean;
  error: unknown;
};

// Global in-memory cache mapped by user identity (uid)
const appDataMemoryCache = new Map<string, TeamSyncAppData>();
const CACHE_KEY_PREFIX = "maviteam_appdata_cache_";

/**
 * useAppData with SWR (Stale-While-Revalidate) & Instant Caching.
 * 
 * 1. Returns cached data immediately if available in memory (0ms LCP delay).
 * 2. Asynchronously fetches latest data from Firestore in the background.
 * 3. Persists to AsyncStorage so repeat visits and reloads never show a blank loading screen.
 */
export function useAppData(enabled: boolean, identityKey: string) {
  // Check memory cache on initialization for immediate 0ms render
  const initialData = enabled && identityKey ? (appDataMemoryCache.get(identityKey) ?? null) : null;

  const [state, setState] = useState<AppDataState>({
    appData: initialData,
    isLoading: initialData === null && enabled,
    error: null,
  });

  const isMountedRef = useRef(true);
  const inFlightRef = useRef<Promise<TeamSyncAppData> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Restore from AsyncStorage if memory cache missed on cold start
  useEffect(() => {
    if (!enabled || !identityKey || identityKey === "anonymous") return;

    if (!appDataMemoryCache.has(identityKey)) {
      AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${identityKey}`)
        .then((storedJson) => {
          if (storedJson && isMountedRef.current) {
            try {
              const cachedData = JSON.parse(storedJson) as TeamSyncAppData;
              if (cachedData?.currentUser?.id) {
                appDataMemoryCache.set(identityKey, cachedData);
                setState((current) => (current.appData === null ? { appData: cachedData, isLoading: false, error: null } : current));
              }
            } catch {
              // Ignore JSON parse errors
            }
          }
        })
        .catch(() => {});
    }
  }, [enabled, identityKey]);

  const load = useCallback(async () => {
    if (inFlightRef.current !== null) {
      return inFlightRef.current;
    }

    const request = teamSyncService.getAppData();
    inFlightRef.current = request;

    try {
      const nextAppData = await request;

      if (identityKey && identityKey !== "anonymous") {
        appDataMemoryCache.set(identityKey, nextAppData);
        AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${identityKey}`, JSON.stringify(nextAppData)).catch(() => {});
      }

      if (isMountedRef.current) {
        setState({ appData: nextAppData, isLoading: false, error: null });
      }

      return nextAppData;
    } catch (error) {
      console.error("[TeamSync] Shared app data fetch failed:", error);

      if (isMountedRef.current) {
        setState((current) => ({
          ...current,
          isLoading: false,
          error,
        }));
      }

      throw error;
    } finally {
      inFlightRef.current = null;
    }
  }, [identityKey]);

  useEffect(() => {
    if (!enabled) {
      setState({ appData: null, isLoading: false, error: null });
      return;
    }

    const currentCached = appDataMemoryCache.get(identityKey) ?? null;
    if (currentCached) {
      setState({ appData: currentCached, isLoading: false, error: null });
    } else {
      setState((current) => ({ ...current, isLoading: current.appData === null }));
    }

    load().catch(() => {});
  }, [enabled, identityKey, load]);

  const refresh = useCallback(() => load(), [load]);

  const setAppData = useCallback(
    (nextAppData: TeamSyncAppData) => {
      if (identityKey && identityKey !== "anonymous") {
        appDataMemoryCache.set(identityKey, nextAppData);
        AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${identityKey}`, JSON.stringify(nextAppData)).catch(() => {});
      }
      setState({ appData: nextAppData, isLoading: false, error: null });
    },
    [identityKey]
  );

  return {
    appData: state.appData,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
    setAppData,
  };
}