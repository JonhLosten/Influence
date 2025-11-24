import React from "react";
import { useLanguage } from "../i18n";
import type { LocaleKey } from "i18n";
import { usePreferences } from "../store/usePreferences";

const Settings: React.FC = () => {
  const { t, setLang, lang } = useLanguage();
  const { showDemoData, toggleShowDemoData } = usePreferences();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">{t("settings_title")}</h1>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="language-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t("settings.language")}
          </label>
          <select
            id="language-select"
            value={lang}
            onChange={(e) => setLang(e.target.value as "en" | "fr")}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
        <div className="flex items-center">
          <input
            id="show-demo-data"
            type="checkbox"
            checked={showDemoData}
            onChange={toggleShowDemoData}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <label
            htmlFor="show-demo-data"
            className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
          >
            {t("settings.showDemoData")}
          </label>
        </div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 mt-6">
        {t("settings_description")}
      </p>
    </div>
  );
};

export default Settings;
