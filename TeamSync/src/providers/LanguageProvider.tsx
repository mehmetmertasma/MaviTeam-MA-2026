import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { defaultLanguage, translations, type Language } from "@/constants/i18n";

const LANGUAGE_STORAGE_KEY = "maviteam_language_v1";

type LanguageContextValue = {
  language: Language;
  setLanguage: (nextLanguage: Language) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  t: (typeof translations)[Language];
  isLanguageReady: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function isSupportedLanguage(value: string | null): value is Language {
  return value === "tr" || value === "en";
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadSavedLanguage() {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

        if (isActive && isSupportedLanguage(savedLanguage)) {
          setLanguageState(savedLanguage);
        }
      } finally {
        if (isActive) {
          setIsLanguageReady(true);
        }
      }
    }

    loadSavedLanguage();

    return () => {
      isActive = false;
    };
  }, []);

  const setLanguage = useCallback(async (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  }, []);

  const toggleLanguage = useCallback(async () => {
    const nextLanguage: Language = language === "tr" ? "en" : "tr";
    await setLanguage(nextLanguage);
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