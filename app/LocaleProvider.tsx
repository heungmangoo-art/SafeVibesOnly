"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type Locale,
  defaultLocale,
  getLocaleFromLanguageTag,
  messages,
} from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  t: (typeof messages)[Locale];
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const LOCALE_STORAGE_KEY = "safevibesonly-locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (stored && (stored === "en" || stored === "ko" || stored === "ja")) {
      setLocaleState(stored);
      document.documentElement.lang = stored === "ko" ? "ko" : stored === "ja" ? "ja" : "en";
      return;
    }
    const browserLang = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage || "";
    const detected = getLocaleFromLanguageTag(browserLang);
    setLocaleState(detected);
    document.documentElement.lang = detected === "ko" ? "ko" : detected === "ja" ? "ja" : "en";
  }, [mounted]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next === "ko" ? "ko" : next === "ja" ? "ja" : "en";
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, t: messages[locale], setLocale }),
    [locale, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: defaultLocale,
      t: messages[defaultLocale],
      setLocale: () => {},
    };
  }
  return ctx;
}
