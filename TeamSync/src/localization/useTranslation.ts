import { useLanguage } from "@/localization/LanguageProvider";

export function useTranslation() {
  return useLanguage();
}
