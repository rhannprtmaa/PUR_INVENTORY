import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useInventory();

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-notification-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        let bgClass = 'bg-white border-slate-200 text-slate-800';
        let IconComponent = CheckCircle2;
        let iconColor = 'text-emerald-600';

        if (toast.type === 'error') {
          bgClass = 'bg-rose-50 border-rose-200 text-rose-900';
          IconComponent = AlertCircle;
          iconColor = 'text-rose-600';
        } else if (toast.type === 'warning') {
          bgClass = 'bg-amber-50 border-amber-200 text-amber-900';
          IconComponent = AlertTriangle;
          iconColor = 'text-amber-600';
        } else if (toast.type === 'info') {
          bgClass = 'bg-blue-50 border-blue-200 text-blue-900';
          IconComponent = Info;
          iconColor = 'text-blue-600';
        } else {
          bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-900';
          IconComponent = CheckCircle2;
          iconColor = 'text-emerald-600';
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg shadow-slate-900/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${bgClass}`}
          >
            <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-sm font-medium leading-snug">{toast.message}</div>
            <button
              id={`toast-close-${toast.id}`}
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 rounded-lg p-0.5 transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
