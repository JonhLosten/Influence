import React, {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

export type LocaleKey = keyof typeof fr;
export type Lang = "fr" | "en";

type Dictionary = Record<LocaleKey, string>;

const DICTS: Record<Lang, Dictionary> = { fr, en };
const STORAGE_KEY = "influenceops.lang";
const DEFAULT_LANG: Lang = "fr";

function readStoredLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "en" || value === "fr") {
      return value;
    }
  } catch (err) {
    console.warn("Unable to read language from storage", err);
  }
  return DEFAULT_LANG;
}

type ReplacementMap = Record<string, string | number>;

class LanguageRuntime {
  private lang: Lang;
  private listeners = new Set<() => void>();

  constructor(initialLang: Lang) {
    this.lang = initialLang;
  }

  private persist(next: Lang) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch (err) {
      console.warn("Unable to persist language", err);
    }
  }

  getLang = () => this.lang;

  getSnapshot = () => this.lang;

  setLang = (lang: Lang) => {
    const normalized: Lang = lang === "en" ? "en" : "fr";
    if (normalized === this.lang) return;
    this.lang = normalized;
    this.persist(normalized);
    this.listeners.forEach((listener) => listener());
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  translate = (key: LocaleKey, replacements?: ReplacementMap) => {
    const dict = DICTS[this.lang] || DICTS[DEFAULT_LANG];
    const template = dict[key] ?? key;
    if (!replacements) return template;
    return Object.entries(replacements).reduce((acc, [token, value]) => {
      return acc.replace(new RegExp(`{{\\s*${token}\\s*}}`, "g"), String(value));
    }, template);
  };
}

export const languageRuntime = new LanguageRuntime(readStoredLang());

const LanguageContext = createContext<LanguageRuntime>(languageRuntime);

export const LanguageProvider: React.FC<{
  runtime?: LanguageRuntime;
  children: React.ReactNode;
}> = ({ runtime = languageRuntime, children }) => {
  return (
    <LanguageContext.Provider value={runtime}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const runtime = useContext(LanguageContext);
  const lang = useSyncExternalStore(
    runtime.subscribe,
    runtime.getSnapshot,
    runtime.getSnapshot
  );

  const translator = useMemo(() => runtime.translate.bind(runtime), [runtime, lang]);

  return {
    lang,
    setLang: runtime.setLang,
    t: translator,
    runtime,
  };
}

export function t(key: LocaleKey, replacements?: ReplacementMap): string {
  return languageRuntime.translate(key, replacements);
}

export type LanguageRuntimeType = LanguageRuntime;
