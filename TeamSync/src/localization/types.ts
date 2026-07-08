import type { tr } from "@/localization/translations/tr";

export type Language = "tr" | "en";

export type TranslationDictionary = typeof tr;

export type SupportedLanguage = {
  code: Language;
  label: string;
  nativeLabel: string;
  shortLabel: string;
  flag: string;
};
