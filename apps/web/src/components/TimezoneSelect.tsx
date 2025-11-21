// apps/web/src/components/TimezoneSelect.tsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface TimezoneSelectProps {
  currentTimezone: string;
  onTimezoneChange: (timezone: string) => void;
  className?: string;
}

const TimezoneSelect: React.FC<TimezoneSelectProps> = ({
  currentTimezone,
  onTimezoneChange,
  className,
}) => {
  const { t } = useTranslation();

  const timezones = useMemo(() => {
    // This is a simple list. For a more comprehensive list, consider a library like 'timezone-js' or 'moment-timezone'.
    // Using `Intl.DateTimeFormat().resolvedOptions().timeZone` gives the current system timezone.
    const allTimezones = Intl.supportedValuesOf("timeZone");
    return allTimezones.map((tz) => ({
      value: tz,
      label: tz.replace(/_/g, " ").replace(/\//g, " / "),
    }));
  }, []);

  return (
    <div className={className}>
      <label
        htmlFor="timezone-select"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {t("timezone")}
      </label>
      <select
        id="timezone-select"
        value={currentTimezone}
        onChange={(e) => onTimezoneChange(e.target.value)}
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
      >
        {timezones.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export { TimezoneSelect };
