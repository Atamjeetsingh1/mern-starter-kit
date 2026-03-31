/**
 * hooks/useToast.js
 * Global toast notification system using React context.
 * Pair with <ToastProvider> in App.jsx.
 *
 * Usage (anywhere in the tree):
 *   const toast = useToast();
 *   toast.success("Saved!");
 *   toast.error("Something went wrong.");
 *   toast.info("Update available.");
 *   toast.warning("Low disk space.");
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

const ToastContext = createContext(null);

let _idCounter = 0;
const genId = () => String(++_idCounter);

// ── Provider ───────────────────────────────────────────────────────────────
export const ToastProvider = ({ children, duration = 4000 }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const addToast = useCallback(
    (message, type = "info", customDuration) => {
      const id = genId();
      const ttl = customDuration ?? duration;

      setToasts((prev) => [...prev, { id, message, type }]);

      if (ttl > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), ttl);
      }

      return id;
    },
    [dismiss, duration]
  );

  const api = {
    success: (msg, dur) => addToast(msg, "success", dur),
    error:   (msg, dur) => addToast(msg, "error",   dur),
    warning: (msg, dur) => addToast(msg, "warning", dur),
    info:    (msg, dur) => addToast(msg, "info",    dur),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

// ── Hook ───────────────────────────────────────────────────────────────────
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
};

// ── Toast UI ───────────────────────────────────────────────────────────────
const STYLES = {
  success: {
    bar:  "bg-green-500",
    icon: "✓",
    wrap: "border-green-200 bg-green-50 text-green-900",
  },
  error: {
    bar:  "bg-red-500",
    icon: "✕",
    wrap: "border-red-200 bg-red-50 text-red-900",
  },
  warning: {
    bar:  "bg-yellow-400",
    icon: "⚠",
    wrap: "border-yellow-200 bg-yellow-50 text-yellow-900",
  },
  info: {
    bar:  "bg-blue-500",
    icon: "i",
    wrap: "border-blue-200 bg-blue-50 text-blue-900",
  },
};

const ToastItem = ({ id, message, type, onDismiss }) => {
  const s = STYLES[type] ?? STYLES.info;
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        relative flex items-start gap-3 min-w-[280px] max-w-sm
        rounded-xl border shadow-lg px-4 py-3
        animate-[slideInRight_200ms_ease-out]
        ${s.wrap}
      `}
    >
      {/* Coloured left bar */}
      <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${s.bar}`} />
      {/* Icon */}
      <span className="font-bold text-sm mt-0.5 select-none">{s.icon}</span>
      {/* Message */}
      <span className="flex-1 text-sm leading-snug">{message}</span>
      {/* Dismiss */}
      <button
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="opacity-50 hover:opacity-100 transition-opacity text-xs font-bold ml-1 mt-0.5"
      >
        ✕
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, onDismiss }) => (
  <div
    aria-label="Notifications"
    className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end"
  >
    {toasts.map((t) => (
      <ToastItem key={t.id} {...t} onDismiss={onDismiss} />
    ))}
  </div>
);

export default useToast;