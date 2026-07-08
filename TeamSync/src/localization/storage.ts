import AsyncStorage from "@react-native-async-storage/async-storage";

import { defaultLanguage } from "@/localization/translations";
import type { Language } from "@/localization/types";

const LANGUAGE_STORAGE_KEY = "maviteam_language_v1";

export function isSupportedLanguage(value: string | null): value is Language {
  return value === "tr" || value === "en";
}

export async function getStoredLanguage() {
  const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (isSupportedLanguage(storedLanguage)) {
    return storedLanguage;
  }

  return defaultLanguage;
}

export async function setStoredLanguage(language: Language) {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}
