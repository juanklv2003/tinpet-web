import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, X } from '@phosphor-icons/react';

interface Toast {
  id: number;
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-ink-dark dark:text-white px-5 py-4 rounded-xl shadow-bento-hover animate-slide-in-right"
          >
            <CheckCircle size={20} weight="fill" className="text-brand-500 shrink-0" />
            <p className="text-sm font-semibold font-manrope">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="ml-2 text-ink-light hover:text-ink-dark dark:hover:text-white transition-colors shrink-0"
              aria-label="Cerrar"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
