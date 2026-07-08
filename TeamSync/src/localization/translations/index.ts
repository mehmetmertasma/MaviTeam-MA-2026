import { en } from "@/localization/translations/en";
import { tr } from "@/localization/translations/tr";
import type { Language, SupportedLanguage, TranslationDictionary } from "@/localization/types";

export const defaultLanguage: Language = "tr";

export const supportedLanguages: SupportedLanguage[] = [
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe", shortLabel: "TR", flag: "🇹🇷" },
  { code: "en", label: "English", nativeLabel: "English", shortLabel: "EN", flag: "🇺🇸" },
];

export const translations: Record<Language, TranslationDictionary> = {
  tr,
  en,
};
