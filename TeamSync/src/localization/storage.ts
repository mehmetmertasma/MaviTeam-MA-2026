import AsyncStorage from "@react-native-async-storage/async-storage";

import { defaultLanguage } from "@/localization/translations";
import type { Language } from "@/localization/types";

const LANGUAGE_STORAGE_KEY = "maviteam_language_v1";

export function isSupportedLanguage(value: string | null): value is Language {
  return value === "tr" || value === "en";
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

  return defaultLanguage;
}

export async function setStoredLanguage(language: Language): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Language changes should still update the current session even if persistence fails.
  }
}
