import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { defaultLanguage, translations } from "@/localization/translations";
import { getStoredLanguage, setStoredLanguage } from "@/localization/storage";
import type { Language, TranslationDictionary } from "@/localization/types";

type LanguageContextValue = {
  language: Language;
  setLanguage: (nextLanguage: Language) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  t: TranslationDictionary;
  isLanguageReady: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadLanguagePreference() {
      try {
        const storedLanguage = await getStoredLanguage();

        if (isActive) {
          setLanguageState(storedLanguage);
        }
      } finally {
        if (isActive) {
          setIsLanguageReady(true);
        }
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
