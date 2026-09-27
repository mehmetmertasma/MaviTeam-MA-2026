import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

import { teamSyncService } from "@/services/teamSyncService";
import type { TeamSyncAppData } from "@/types/teamSync";

type AppDataState = {
  appData: TeamSyncAppData | null;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
};

// Global in-memory cache mapped by user identity (uid)
const appDataMemoryCache = new Map<string, TeamSyncAppData>();
const CACHE_KEY_PREFIX = "maviteam_appdata_cache_";
const LAST_ACTIVE_SNAPSHOT_KEY = "maviteam_last_active_snapshot";

function isValidAppData(candidate: unknown): candidate is TeamSyncAppData {
  if (!candidate || typeof candidate !== "object") return false;
  const data = candidate as Record<string, unknown>;
  const hasUser = Boolean(
    (data.currentUser && typeof data.currentUser === "object" && "id" in (data.currentUser as Record<string, unknown>)) ||
    (data.user && typeof data.user === "object" && "id" in (data.user as Record<string, unknown>))
  );
  const hasClub = Boolean(data.club && typeof data.club === "object" && "id" in (data.club as Record<string, unknown>));
  return hasUser || hasClub;
}

function getInitialAppDataSnapshot(enabled: boolean, identityKey: string): TeamSyncAppData | null {
  if (!enabled || identityKey === "anonymous") return null;

  if (identityKey && appDataMemoryCache.has(identityKey)) {
    return appDataMemoryCache.get(identityKey) ?? null;
  }

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      if (identityKey) {
        const userJson = window.localStorage.getItem(`${CACHE_KEY_PREFIX}${identityKey}`);
        if (userJson) {
          const parsed = JSON.parse(userJson);
          if (isValidAppData(parsed)) {
            appDataMemoryCache.set(identityKey, parsed);
            return parsed;
          }
        }
      }

      const snapshotJson = window.localStorage.getItem(LAST_ACTIVE_SNAPSHOT_KEY);
      if (snapshotJson) {
        const parsed = JSON.parse(snapshotJson);
        if (isValidAppData(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }

  return null;
}

/**
 * useAppData with SWR (Stale-While-Revalidate) & Instant Snapshot Caching.
 * 
 * 1. Restores the last active snapshot immediately from AsyncStorage on mount (0ms cold start).
 * 2. Unblocks UI rendering before Firebase Auth completes its remote handshake.
 * 3. Once Auth confirms user identity, revalidates from Firestore in the background.
 * 4. Persists the fresh data to both user cache and the last active snapshot.
 */
export function useAppData(enabled: boolean, identityKey: string) {
  const [state, setState] = useState<AppDataState>(() => {
    const initialData = getInitialAppDataSnapshot(enabled, identityKey);
    return {
      appData: initialData,
      isLoading: initialData === null,
      isValidating: enabled && Boolean(identityKey) && identityKey !== "anonymous",
      error: null,
    };
  });

  const isMountedRef = useRef(true);
  const inFlightRef = useRef<Promise<TeamSyncAppData> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Hydrate last active snapshot immediately on mount (runs on frame 1 without waiting for auth)
  useEffect(() => {
    if (state.appData !== null) return;

    AsyncStorage.getItem(LAST_ACTIVE_SNAPSHOT_KEY)
      .then((storedJson) => {
        if (storedJson && isMountedRef.current) {
          try {
            const cachedData = JSON.parse(storedJson);
            if (isValidAppData(cachedData)) {
              setState((current) =>
                current.appData === null
                  ? { ...current, appData: cachedData, isLoading: false, error: null }
                  : current
              );
            }
          } catch {
            // Ignore JSON parse errors
          }
        }
      })
      .catch(() => {});
  }, [state.appData]);

  // Restore user-specific cache once identityKey is known
  useEffect(() => {
    if (!enabled || !identityKey || identityKey === "anonymous") return;

    if (!appDataMemoryCache.has(identityKey)) {
      AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${identityKey}`)
        .then((storedJson) => {
          if (storedJson && isMountedRef.current) {
            try {
              const cachedData = JSON.parse(storedJson);
              if (isValidAppData(cachedData)) {
                appDataMemoryCache.set(identityKey, cachedData);
                setState((current) =>
                  current.appData === null || current.appData.currentUser.id !== identityKey
                    ? { ...current, appData: cachedData, isLoading: false, error: null }
                    : current
                );
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

    if (isMountedRef.current) {
      setState((current) => ({ ...current, isValidating: true }));
    }

    const request = teamSyncService.getAppData();
    inFlightRef.current = request;

    try {
      const nextAppData = await request;

      if (identityKey && identityKey !== "anonymous") {
        appDataMemoryCache.set(identityKey, nextAppData);
        const serialized = JSON.stringify(nextAppData);
        AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${identityKey}`, serialized).catch(() => {});
        AsyncStorage.setItem(LAST_ACTIVE_SNAPSHOT_KEY, serialized).catch(() => {});
        if (typeof window !== "undefined" && window.localStorage) {
          try {
            window.localStorage.setItem(`${CACHE_KEY_PREFIX}${identityKey}`, serialized);
            window.localStorage.setItem(LAST_ACTIVE_SNAPSHOT_KEY, serialized);
          } catch {
            // Ignore
          }
        }
      }

      if (isMountedRef.current) {
        setState({
          appData: nextAppData,
          isLoading: false,
          isValidating: false,
          error: null,
        });
      }

      return nextAppData;
    } catch (error) {
      console.error("[TeamSync] Shared app data fetch failed:", error);

      if (isMountedRef.current) {
        setState((current) => ({
          ...current,
          isLoading: false,
          isValidating: false,
          error,
        }));
      }

      throw error;
    } finally {
      inFlightRef.current = null;
    }
  }, [identityKey]);

  useEffect(() => {
    // If auth explicitly resolved that there is no user signed in, clear snapshot
    if (enabled && identityKey === "anonymous") {
      setState({ appData: null, isLoading: false, isValidating: false, error: null });
      AsyncStorage.removeItem(LAST_ACTIVE_SNAPSHOT_KEY).catch(() => {});
      return;
    }

    if (!enabled) {
      return;
    }

    const currentCached = appDataMemoryCache.get(identityKey) ?? null;
    if (currentCached) {
      setState((current) => ({ ...current, appData: currentCached, isLoading: false }));
    } else {
      setState((current) => ({
        ...current,
        isLoading: current.appData === null,
        isValidating: true,
      }));
    }

    load().catch(() => {});
  }, [enabled, identityKey, load]);

  const refresh = useCallback(() => load(), [load]);

  const setAppData = useCallback(
    (nextAppData: TeamSyncAppData) => {
      if (identityKey && identityKey !== "anonymous") {
        appDataMemoryCache.set(identityKey, nextAppData);
        AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${identityKey}`, JSON.stringify(nextAppData)).catch(() => {});
        AsyncStorage.setItem(LAST_ACTIVE_SNAPSHOT_KEY, JSON.stringify(nextAppData)).catch(() => {});
      }
      setState({ appData: nextAppData, isLoading: false, isValidating: false, error: null });
    },
    [identityKey]
  );

  return {
    appData: state.appData,
    isLoading: state.isLoading,
    isValidating: state.isValidating,
    error: state.error,
    refresh,
    setAppData,
  };
}