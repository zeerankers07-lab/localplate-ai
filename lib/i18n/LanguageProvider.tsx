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
  DICTIONARIES,
  type Lang,
  type TranslationKey,
} from "./translations";

export type CurrencyCode = "PKR" | "INR" | "USD";

const LANG_KEY = "localplate_lang";
const CURRENCY_KEY = "localplate_currency";

type Vars = Record<string, string | number>;

type I18nContext = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  dir: "ltr" | "rtl";
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
  // Translates "prefix.value" when it exists, otherwise returns the value.
  label: (prefix: string, value: string) => string;
};

const Context = createContext<I18nContext | null>(null);

// Pakistan: PKR, India: INR, everyone else: USD.
function detectCurrency(): CurrencyCode {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (zone === "Asia/Karachi") return "PKR";
    if (zone === "Asia/Kolkata" || zone === "Asia/Calcutta") return "INR";

    const locale = navigator.language || "";

    if (/-PK$/i.test(locale)) return "PKR";
    if (/-IN$/i.test(locale)) return "INR";
  } catch {
    // Fall through to USD.
  }

  return "USD";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");

  // Read the saved choices (English and the detected currency are the defaults).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedLang = localStorage.getItem(LANG_KEY);

        if (savedLang === "en" || savedLang === "ur" || savedLang === "hi") {
          setLangState(savedLang);
        }

        const savedCurrency = localStorage.getItem(CURRENCY_KEY);

        if (
          savedCurrency === "PKR" ||
          savedCurrency === "INR" ||
          savedCurrency === "USD"
        ) {
          setCurrencyState(savedCurrency);
        } else {
          setCurrencyState(detectCurrency());
        }
      } catch {
        setCurrencyState(detectCurrency());
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const dir: "ltr" | "rtl" = lang === "ur" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);

    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // The choice still applies for this visit.
    }
  }, []);

  const setCurrency = useCallback((next: CurrencyCode) => {
    setCurrencyState(next);

    try {
      localStorage.setItem(CURRENCY_KEY, next);
    } catch {
      // The choice still applies for this visit.
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Vars) => {
      let text = DICTIONARIES[lang][key] ?? DICTIONARIES.en[key] ?? key;

      if (vars) {
        Object.entries(vars).forEach(([name, value]) => {
          text = text.split(`{${name}}`).join(String(value));
        });
      }

      return text;
    },
    [lang]
  );

  const label = useCallback(
    (prefix: string, value: string) => {
      const key = `${prefix}.${value}` as TranslationKey;
      return key in DICTIONARIES.en ? t(key) : value;
    },
    [t]
  );

  const value = useMemo(
    () => ({ lang, setLang, dir, currency, setCurrency, t, label }),
    [lang, setLang, dir, currency, setCurrency, t, label]
  );

  return (
    <Context.Provider value={value}>
      <style>{`
        html[lang="ur"] body {
          font-family: "Noto Naskh Arabic", "Noto Nastaliq Urdu", "Urdu Typesetting", "Segoe UI", Tahoma, sans-serif;
        }
        html[lang="hi"] body {
          font-family: "Noto Sans Devanagari", "Nirmala UI", "Segoe UI", sans-serif;
        }
      `}</style>
      {children}
    </Context.Provider>
  );
}

export function useI18n() {
  const context = useContext(Context);

  if (!context) {
    throw new Error("useI18n must be used inside LanguageProvider");
  }

  return context;
}