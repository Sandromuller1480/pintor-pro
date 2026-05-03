import React from 'react';
import { AlertTriangle, Loader2, Trash2, type LucideIcon } from 'lucide-react';

interface DashboardConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description?: React.ReactNode;
  eyebrow?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  icon?: LucideIcon;
  confirmIcon?: LucideIcon;
}

export const DashboardConfirmationDialog: React.FC<DashboardConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  eyebrow = 'Alerta de exclusao',
  cancelLabel = 'Cancelar',
  confirmLabel = 'Excluir',
  isLoading = false,
  onCancel,
  onConfirm,
  icon: Icon = AlertTriangle,
  confirmIcon: ConfirmIcon = Trash2
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[32px] border border-red-200 bg-white p-8 shadow-[0_40px_120px_rgba(15,23,42,0.32)]">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-red-100 p-3 text-red-600">
            <Icon size={22} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-red-500">{eyebrow}</p>
            <h3 className="mt-2 text-2xl font-black text-[#000747]">{title}</h3>
            {description ? (
              <div className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                {description}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <ConfirmIcon size={16} className="mr-2" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
