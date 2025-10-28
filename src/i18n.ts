import fr from "./locales/fr.json";
import en from "./locales/en.json";

export type LocaleKey = keyof typeof fr;
export type Lang = "fr" | "en";

const DICTS: Record<Lang, Record<string, string>> = { fr, en };
const STORAGE_KEY = "influenceops.lang";
const DEFAULT_LANG: Lang = "fr";

let currentLang: Lang = DEFAULT_LANG;

const listeners = new Set<(lang: Lang) => void>();

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

currentLang = readStoredLang();

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang) {
  if (lang === currentLang) return;
  currentLang = lang;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      console.warn("Unable to persist language", err);
    }
  }
  listeners.forEach((listener) => listener(lang));
}

export function subscribeToLangChange(listener: (lang: Lang) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function t(key: LocaleKey): string {
  const dict = DICTS[currentLang] || DICTS[DEFAULT_LANG];
  return dict[key] || key;
}
