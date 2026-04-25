import { useCallback, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, AlertCircle, Info } from 'lucide-react';
import { ToastContext } from './ToastContext';
import './Toast.css';

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((message, opts = {}) => {
    const id = ++idRef.current;
    const toast = { id, message, type: opts.type || 'success', duration: opts.duration ?? 3000 };
    setToasts((t) => [...t, toast]);
    if (toast.duration > 0) {
      setTimeout(() => remove(id), toast.duration);
    }
    return id;
  }, [remove]);

  const api = {
    show,
    success: (msg, opts) => show(msg, { ...opts, type: 'success' }),
    error: (msg, opts) => show(msg, { ...opts, type: 'error' }),
    info: (msg, opts) => show(msg, { ...opts, type: 'info' }),
    dismiss: remove,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={`toast toast--${t.type}`}
              role="status"
            >
              <span className="toast__icon">
                {t.type === 'success' && <Check size={16} />}
                {t.type === 'error' && <AlertCircle size={16} />}
                {t.type === 'info' && <Info size={16} />}
              </span>
              <span className="toast__message">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
