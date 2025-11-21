// apps/web/src/views/Troubleshooting.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { ERROR_CODES, ErrorCode } from "@influence/sdk/errors"; // Import ERROR_CODES

const Troubleshooting: React.FC = () => {
  const { t } = useTranslation();

  // Dynamically generate solutions based on error codes
  const getSolution = (errorCode: ErrorCode): string[] => {
    switch (errorCode) {
      case "VALIDATION-INPUT-INVALID":
      case "VALIDATION-INPUT-REQUIRED":
      case "VALIDATION-INPUT-TOO_LONG":
        return [t("solution_validation_check_input")];
      case "AUTH-CREDENTIALS-INVALID":
      case "AUTH-CREDENTIALS-EXPIRED":
      case "AUTH-CREDENTIALS-MISSING":
        return [
          t("solution_auth_reconnect_account"),
          t("solution_auth_check_permissions"),
        ];
      case "API-NETWORK-UNAVAILABLE":
        return [
          t("solution_api_check_network_status"),
          t("solution_api_retry_later"),
        ];
      case "API-NETWORK-RATE_LIMIT":
        return [
          t("solution_api_wait_and_retry"),
          t("solution_api_check_subscription"),
        ];
      case "API-PROVIDER-ERROR":
        return [t("solution_api_contact_support_provider")];
      case "VIDEO-PROCESSING-METADATA_FAILED":
      case "VIDEO-MISSING-FILE":
        return [
          t("solution_video_check_file_validity"),
          t("solution_video_check_file_path"),
        ];
      case "VIDEO-PROCESSING-REENCODE_FAILED":
        return [
          t("solution_video_try_another_file_reencode"),
          t("solution_video_contact_support"),
        ];
      case "VIDEO-CONSTRAINTS-DURATION":
      case "VIDEO-CONSTRAINTS-RATIO":
      case "VIDEO-CONSTRAINTS-SIZE":
        return [
          t("solution_video_adjust_reencode"),
          t("solution_video_choose_another_network"),
        ];
      case "PUBLISH-GENERIC-FAILED":
      case "PUBLISH-CAPTION_LENGTH":
      case "PUBLISH-MISSING-PROFILE":
      case "PUBLISH-NETWORK-DISCONNECTED":
        return [
          t("solution_publish_check_post_details"),
          t("solution_publish_reconnect_profile"),
          t("solution_publish_retry_post"),
        ];
      case "DB-SCHEMA-INVALID":
      case "DB-GENERIC-ERROR":
        return [t("solution_db_contact_support_db")];
      case "SYSTEM-GENERIC-INTERNAL":
        return [
          t("solution_system_restart_app"),
          t("solution_system_download_logs"),
          t("solution_system_contact_support"),
        ];
      default:
        return [t("solution_default_contact_support")];
    }
  };

  const sortedErrorCodes = Object.keys(ERROR_CODES).sort() as ErrorCode[];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">{t("troubleshooting_title")}</h1>
      <p className="text-gray-700 dark:text-gray-300 mb-8">
        {t("troubleshooting_description")}
      </p>

      <div className="space-y-6">
        {sortedErrorCodes.map((code) => {
          const errorInfo = ERROR_CODES[code];
          const solutions = getSolution(code);
          return (
            <div
              key={code}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
            >
              <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                {code}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                {t(errorInfo.userMessageKey)}
              </p>
              <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t("solutions")}
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                {solutions.map((solution, idx) => (
                  <li key={idx}>{solution}</li>
                ))}
              </ul>
              {code === "SYSTEM-GENERIC-INTERNAL" && (
                <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                  {t("download_logs_button")} {/* Future functionality */}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Troubleshooting;
