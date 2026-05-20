import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, X, CircleNotch, WarningCircle, Info } from '@phosphor-icons/react';

interface Toast {
  id: number;
  message: string;
  type?: 'success' | 'error' | 'info' | 'loading';
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast['type']) => number;
  dismissToast: (id: number) => void;
  updateToast: (id: number, message: string, type: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => 0,
  dismissToast: () => {},
  updateToast: () => {},
});

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);

    if (type !== 'loading') {
      setTimeout(() => {
        dismissToast(id);
      }, 4000);
    }
    return id;
  }, [dismissToast]);

  const updateToast = useCallback((id: number, message: string, type: Toast['type']) => {
    setToasts(prev =>
      prev.map(t => (t.id === id ? { ...t, message, type } : t))
    );

    if (type !== 'loading') {
      setTimeout(() => {
        dismissToast(id);
      }, 4000);
    }
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, updateToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full sm:w-auto">
        {toasts.map(toast => {
          let icon = <CheckCircle size={20} weight="fill" className="text-brand shrink-0" />;
          let borderClass = "border-l-4 border-l-brand";
          let bgClass = "bg-white dark:bg-slate-800";

          if (toast.type === 'error') {
            icon = <WarningCircle size={20} weight="fill" className="text-rose-500 shrink-0" />;
            borderClass = "border-l-4 border-l-rose-500";
          } else if (toast.type === 'info') {
            icon = <Info size={20} weight="fill" className="text-sky-500 shrink-0" />;
            borderClass = "border-l-4 border-l-sky-500";
          } else if (toast.type === 'loading') {
            icon = <CircleNotch size={20} weight="bold" className="text-brand animate-spin shrink-0" />;
            borderClass = "border-l-4 border-l-brand shadow-[0_0_15px_rgba(206,73,152,0.15)]";
            bgClass = "bg-brand-50/95 dark:bg-slate-800/95 backdrop-blur-md";
          } else {
            // success
            icon = <CheckCircle size={20} weight="fill" className="text-brand shrink-0" />;
            borderClass = "border-l-4 border-l-brand";
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 ${bgClass} border border-slate-200 dark:border-slate-700 ${borderClass} text-ink-dark dark:text-white px-5 py-4 rounded-xl shadow-bento-hover animate-slide-in-right`}
            >
              {icon}
              <p className="text-sm font-semibold font-manrope">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="ml-auto pl-2 text-ink-light hover:text-ink-dark dark:hover:text-white transition-colors shrink-0"
                aria-label="Cerrar"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
