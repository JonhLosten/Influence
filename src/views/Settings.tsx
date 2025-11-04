import React from "react";
import { useLanguage } from "../i18n";
import { usePreferences } from "../store/usePreferences";

export function Settings() {
  const { lang, setLang, t } = useLanguage();
  const {
    prefs: { showDemoData },
    setShowDemoData,
  } = usePreferences();

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

      <div className="border-t pt-3 mt-3 space-y-2">
        <div>
          <div className="text-sm font-medium text-gray-800">
            {t("settings.demoData.title")}
          </div>
          <p className="text-xs text-gray-500">
            {t("settings.demoData.description")}
          </p>
        </div>
        <label className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 border rounded-xl px-3 py-2">
          <span>{t("settings.demoData.toggle")}</span>
          <input
            type="checkbox"
            checked={showDemoData}
            onChange={(event) => setShowDemoData(event.target.checked)}
            className="h-4 w-4"
          />
        </label>
      </div>
    </div>
  );
}
