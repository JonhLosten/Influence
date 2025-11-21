// apps/web/src/views/Settings.tsx
import React from "react";
import { useTranslation } from "react-i18next";

const Settings: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">{t("settings_title")}</h1>
      <p className="text-gray-700 dark:text-gray-300">
        {t("settings_description")}
      </p>
      {/* Future settings: API keys, account management, notification preferences, etc. */}
    </div>
  );
};

export default Settings;
