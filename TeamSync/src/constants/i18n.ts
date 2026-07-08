import { defaultLanguage, translations } from "@/localization";

export { defaultLanguage, supportedLanguages, translations } from "@/localization";
export type { Language, TranslationDictionary as Translations } from "@/localization";

export const t = translations[defaultLanguage];
export type TranslationKeys = keyof typeof t;
