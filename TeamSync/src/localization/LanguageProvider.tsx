import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import { translations } from "@/localization/translations";
import { detectDeviceLanguage, getStoredLanguage, setStoredLanguage } from "@/localization/storage";
import type { Language, TranslationDictionary } from "@/localization/types";

type LanguageContextValue = {
  language: Language;
  setLanguage: (nextLanguage: Language) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  t: TranslationDictionary;
  isLanguageReady: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

// On web, pages are prerendered to static HTML (app.json web.output "static").
// Starting there in a fixed language and already "ready" means that HTML holds
// the real page content instead of a loading screen -- which is what search
// engines index -- and the first client render matches it for hydration. The
// stored/device preference is then applied by the effect below.
const isWeb = Platform.OS === "web";
const WEB_INITIAL_LANGUAGE: Language = "tr";

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>(() => (isWeb ? WEB_INITIAL_LANGUAGE : detectDeviceLanguage()));
  const [isLanguageReady, setIsLanguageReady] = useState(isWeb);

  useEffect(() => {
    let isActive = true;

    async function loadLanguagePreference() {
      const storedLanguage = await getStoredLanguage();

      if (isActive) {
        setLanguageState(storedLanguage);
        setIsLanguageReady(true);
      }
    }

    loadLanguagePreference();

    return () => {
      isActive = false;
    };
  }, []);

  const setLanguage = useCallback(async (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    await setStoredLanguage(nextLanguage);
  }, []);

  const toggleLanguage = useCallback(async () => {
    await setLanguage(language === "tr" ? "en" : "tr");
  }, [language, setLanguage]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t: translations[language],
      isLanguageReady,
    }),
    [isLanguageReady, language, setLanguage, toggleLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }

  return context;
}
