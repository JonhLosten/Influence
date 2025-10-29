import React from "react";
import { useLanguage } from "../i18n";
import { useAppState } from "../store/useAppState";

export function Settings() {
  const { lang, setLang, t } = useLanguage();
  const {
    state: { preferences },
    actions: { setDemoDataEnabled },
  } = useAppState();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value === "en" ? "en" : "fr";
    setLang(v);
  }

  function onToggleDemo(e: React.ChangeEvent<HTMLInputElement>) {
    setDemoDataEnabled(e.target.checked);
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
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 font-medium">
              {t("settings.demoData")}
            </div>
            <p className="text-xs text-gray-500">
              {t("settings.demoData.description")}
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={preferences.demoDataEnabled}
              onChange={onToggleDemo}
              className="w-4 h-4"
            />
            <span>
              {preferences.demoDataEnabled
                ? t("settings.demoData.enabled")
                : t("settings.demoData.disabled")}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
