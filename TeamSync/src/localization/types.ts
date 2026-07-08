import type { tr } from "@/localization/translations/tr";

export type Language = "tr" | "en";

type WidenTranslationValues<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer Item)[]
        ? readonly WidenTranslationValues<Item>[]
        : T extends object
          ? { [Key in keyof T]: WidenTranslationValues<T[Key]> }
          : T;

export type TranslationDictionary = WidenTranslationValues<typeof tr>;

export type SupportedLanguage = {
  code: Language;
  label: string;
  nativeLabel: string;
  shortLabel: string;
  flag: string;
};
