import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

const ICONS = {
  success: <CheckCircle size={16} className="text-success" />,
  error: <XCircle size={16} className="text-danger" />,
  warning: <AlertCircle size={16} className="text-warning" />,
  info: <Info size={16} className="text-accent-blue" />,
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="flex items-start gap-3 bg-bg-tertiary border border-gray-700 rounded-xl p-3.5 shadow-2xl animate-fade-in"
        >
          <div className="mt-0.5 shrink-0">{ICONS[toast.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">{toast.title}</p>
            {toast.message && <p className="text-xs text-gray-400 mt-0.5">{toast.message}</p>}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-500 hover:text-gray-300 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
