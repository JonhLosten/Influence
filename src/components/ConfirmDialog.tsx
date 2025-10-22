import React from "react";

export const ConfirmDialog: React.FC<{
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  isOpen,
  title = "Confirmation",
  message,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
}) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-6 w-96 shadow-md space-y-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-700">{message}</p>
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1 rounded-lg border hover:bg-gray-100"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
            <button
              className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700"
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  };
