import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";

import { defaultLanguage } from "@/localization/translations";
import type { Language } from "@/localization/types";

const LANGUAGE_STORAGE_KEY = "maviteam_language_v1";

export function isSupportedLanguage(value: string | null): value is Language {
  return value === "tr" || value === "en";
}

/**
 * Detects a default language from the device's own locale settings.
 * expo-localization reads this from the OS on native (iOS/Android) and from
 * the browser on web, unlike a raw `navigator`/`Intl` check, which is
 * web-only and silently no-ops on native. If the device's top locale is
 * Turkish -> "tr", otherwise -> defaultLanguage ("en").
 */
export function detectDeviceLanguage(): Language {
  try {
    const [topLocale] = getLocales();

    if (topLocale?.languageCode?.toLowerCase() === "tr") {
      return "tr";
    }
  } catch {
    // If locale info is inaccessible, safely fallback to defaultLanguage ("en")
  }

  return defaultLanguage;
}

export async function getStoredLanguage(): Promise<Language> {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (isSupportedLanguage(storedLanguage)) {
      return storedLanguage;
    }
  } catch {
    // Keep the app usable if local storage is unavailable.
  }

  return detectDeviceLanguage();
}

export async function setStoredLanguage(language: Language): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Language changes should still update the current session even if persistence fails.
  }
}
