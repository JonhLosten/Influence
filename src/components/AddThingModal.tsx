import React from "react";
import { useLanguage } from "../i18n";

export const AddThingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onChoose: (choice: "account" | "folder") => void;
}> = ({ isOpen, onClose, onChoose }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 shadow space-y-4">
        <h2 className="text-lg font-semibold">{t("modal.add.title")}</h2>
        <div className="flex gap-3">
          <button
            className="flex-1 px-3 py-2 rounded-lg border hover:bg-blue-50"
            onClick={() => onChoose("account")}
          >
            {t("modal.add.account")}
          </button>
          <button
            className="flex-1 px-3 py-2 rounded-lg border hover:bg-blue-50"
            onClick={() => onChoose("folder")}
          >
            {t("modal.add.folder")}
          </button>
        </div>
        <div className="flex justify-end">
          <button className="px-3 py-1 rounded-lg border" onClick={onClose}>
            {t("modal.close")}
          </button>
        </div>
      </div>
    </div>
  );
};
