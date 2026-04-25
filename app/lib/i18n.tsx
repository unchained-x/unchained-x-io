import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "en" | "ja";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

const translations: Record<Locale, Record<string, string>> = {
  en: {
    "company.label.company": "Company",
    "company.label.founded": "Founded",
    "company.label.location": "Location",
    "company.label.representative": "Representative",
    "company.label.contact": "Contact",
  },
  ja: {
    "company.label.company": "会社名",
    "company.label.founded": "設立",
    "company.label.location": "所在地",
    "company.label.representative": "代表者",
    "company.label.contact": "お問い合わせ",
  },
};

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language || "";
  return lang.startsWith("ja") ? "ja" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem("unchainedx-locale") as Locale | null;
    setLocaleState(stored || detectLocale());
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("unchainedx-locale", l);
  }, []);

  const t = useCallback((key: string) => {
    return translations[locale][key] || translations.en[key] || key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
