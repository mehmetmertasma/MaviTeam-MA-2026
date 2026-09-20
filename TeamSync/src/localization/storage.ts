import AsyncStorage from "@react-native-async-storage/async-storage";

import { defaultLanguage } from "@/localization/translations";
import type { Language } from "@/localization/types";

const LANGUAGE_STORAGE_KEY = "maviteam_language_v1";

export function isSupportedLanguage(value: string | null): value is Language {
  return value === "tr" || value === "en";
}

/**
 * Automatically detects if the user is located in Turkey (via timezone and locale).
 * If located in Turkey -> "tr"
 * If located elsewhere or inaccessible -> "en" (defaultLanguage)
 */
export function detectLocationLanguage(): Language {
  try {
    // Check IANA TimeZone (e.g. Europe/Istanbul, Asia/Istanbul, Turkey, etc.)
    const timeZone = Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone?.toLowerCase() ?? "";
    if (timeZone.includes("istanbul") || timeZone.includes("turkey") || timeZone === "etc/gmt-3") {
      return "tr";
    }

    // Check System / Browser Locale
    if (typeof navigator !== "undefined") {
      const languages = (navigator.languages || [navigator.language]).filter(Boolean);
      for (const lang of languages) {
        if (typeof lang === "string" && lang.toLowerCase().startsWith("tr")) {
          return "tr";
        }
      }
    }
  } catch {
    // If location or locale is inaccessible, safely fallback to defaultLanguage ("en")
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

  return detectLocationLanguage();
}

export async function setStoredLanguage(language: Language): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Language changes should still update the current session even if persistence fails.
  }
}
