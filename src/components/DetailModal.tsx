import React, { useEffect } from "react";
import { X, Edit2, Save, Trash2 } from "lucide-react";

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  onEdit?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
  isSaving?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function DetailModal({
  isOpen,
  onClose,
  title,
  children,
  onEdit,
  onSave,
  onDelete,
  isEditing = false,
  isSaving = false,
  canEdit = true,
  canDelete = false,
}: DetailModalProps) {
  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      if (!document.querySelector('[role="dialog"]')) {
        document.body.style.overflow = "auto";
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate pr-4">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {canEdit && !isEditing && (
              <button
                onClick={onEdit}
                className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 transition-all shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                title="Editar registro"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={onDelete}
                className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                title="Eliminar registro"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-all"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 active:scale-95"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

interface DetailGroupProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  hideTitle?: boolean;
  noBorder?: boolean;
}

export function DetailGroup({
  title,
  icon,
  children,
  hideTitle = false,
  noBorder = false,
}: DetailGroupProps) {
  return (
    <div
      className={`${noBorder ? "" : "bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm"}`}
    >
      {!hideTitle && title && (
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
          {icon && (
            <span className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 p-1.5 rounded-lg">
              {icon}
            </span>
          )}
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {title}
          </h3>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {children}
      </div>
    </div>
  );
}

interface DetailItemProps {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

export function DetailItem({ label, value, fullWidth }: DetailItemProps) {
  return (
    <div className={`space-y-1 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <dt className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-words leading-tight">
        {value || (
          <span className="text-slate-300 dark:text-slate-600 italic font-normal">
            -
          </span>
        )}
      </dd>
    </div>
  );
}
