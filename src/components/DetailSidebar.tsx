import React, { useEffect } from "react";
import { X, ChevronRight, Edit2, Save, Trash2 } from "lucide-react";

interface DetailSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
  isSaving?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function DetailSidebar({
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
}: DetailSidebarProps) {
  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when open
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      if (!document.querySelector('[role="dialog"]')) {
        document.body.style.overflow = "auto";
      }
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl z-[70] transform transition-transform duration-300 ease-out border-l border-slate-200 dark:border-slate-800 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
              <ChevronRight className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && !isEditing && (
              <button
                onClick={onEdit}
                className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 transition-all"
                title="Editar registro"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={onDelete}
                className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all"
                title="Eliminar registro"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-all"
              aria-label="Cerrar panel"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 bg-slate-50/30 dark:bg-slate-900/50 transition-colors">
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center transition-colors">
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-all shadow-sm disabled:opacity-50"
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
            className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all shadow-sm"
          >
            Cerrar
          </button>
        </div>
      </aside>
    </>
  );
}

interface DetailGroupProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function DetailGroup({ title, icon, children }: DetailGroupProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        {icon && (
          <span className="text-slate-500 dark:text-slate-400">{icon}</span>
        )}
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
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
    <div
      className={`space-y-0.5 p-1 px-2 rounded-lg hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors ${fullWidth ? "sm:col-span-2" : ""}`}
    >
      <dt className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-words leading-tight">
        {value || (
          <span className="text-slate-300 dark:text-slate-600 italic font-normal">
            No especificado
          </span>
        )}
      </dd>
    </div>
  );
}
