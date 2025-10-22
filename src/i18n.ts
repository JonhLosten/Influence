
import fr from './locales/fr.json'
import en from './locales/en.json'

export type LocaleKey = keyof typeof fr

const DICTS: Record<string, Record<string, string>> = { fr, en }

const STORAGE_KEY = 'influenceops.lang'

export function getLang(): 'fr'|'en' {
  const v = localStorage.getItem(STORAGE_KEY)
  return (v === 'en' || v === 'fr') ? v : 'fr'
}

export function setLang(l: 'fr'|'en') {
  localStorage.setItem(STORAGE_KEY, l)
  window.location.reload()
}

export function t(key: LocaleKey): string {
  const lang = getLang()
  const dict = DICTS[lang] || DICTS.fr
  return dict[key] || key
}
