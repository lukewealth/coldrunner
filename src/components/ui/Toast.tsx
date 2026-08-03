import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration || 4000;
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const borderMap: Record<ToastType, string> = {
  success: 'border-emerald-200',
  error: 'border-red-200',
  warning: 'border-amber-200',
  info: 'border-blue-200',
};

const bgMap: Record<ToastType, string> = {
  success: 'bg-emerald-50',
  error: 'bg-red-50',
  warning: 'bg-amber-50',
  info: 'bg-blue-50',
};

const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => (
  <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
    <AnimatePresence mode="popLayout">
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, x: 80, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.95, transition: { duration: 0.2 } }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`pointer-events-auto bg-white rounded-2xl shadow-lg ring-1 ring-slate-200 border ${borderMap[toast.type]} p-4 flex items-start gap-3`}
        >
          <div className={`flex-shrink-0 mt-0.5`}>{iconMap[toast.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
            {toast.message && (
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);
