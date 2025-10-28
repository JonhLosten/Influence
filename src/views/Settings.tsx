import React from "react";
import { useLanguage } from "../i18n";

export function Settings() {
  const { lang, setLang, t } = useLanguage();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value === "en" ? "en" : "fr";
    setLang(v);
  }

  return (
    <div className="max-w-md bg-white border rounded-2xl p-4 space-y-3">
      <div className="text-xl font-semibold">{t("nav.settings")}</div>
      <label className="block">
        <span className="text-sm text-gray-500">{t("settings.language")}</span>
        <select value={lang} onChange={onChange} className="mt-1 w-full border rounded-lg p-2">
          <option value="fr">{t("settings.language.fr")}</option>
          <option value="en">{t("settings.language.en")}</option>
        </select>
      </label>
      <p className="text-xs text-gray-500">{t("settings.language.persisted")}</p>
    </div>
  );
}
