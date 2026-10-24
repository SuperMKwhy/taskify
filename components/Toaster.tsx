"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type ToastTone = "neutral" | "error";

interface ToastOptions {
  tone?: ToastTone;
  /** Milliseconds before auto-dismiss. */
  duration?: number;
  action?: { label: string; onClick: () => void };
  onExpire?: () => void;
}

interface Toast extends ToastOptions {
  id: number;
  message: string;
}

interface ToastApi {
  show: (message: string, options?: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    const id = nextId.current++;
    // Keep the stack short - three is plenty to read.
    setToasts((prev) => [...prev.slice(-2), { id, message, ...options }]);
    return id;
  }, []);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const { id, duration = 4000, onExpire } = toast;
  const actedRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!actedRef.current) onExpire?.();
      onDismiss(id);
    }, duration);
    return () => window.clearTimeout(timer);
    // Each toast schedules its own expiry exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      layout
      role={toast.tone === "error" ? "alert" : "status"}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="glass-strong pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl py-2.5 pl-4 pr-2 text-sm text-fg"
    >
      {toast.tone === "error" && (
        <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-danger" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 4.75v3.75M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      <span className="min-w-0 flex-1">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            actedRef.current = true;
            toast.action?.onClick();
            onDismiss(id);
          }}
          className="shrink-0 rounded-xl px-3 py-1.5 text-sm font-semibold text-accent transition-colors hover:bg-white/10"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          if (!actedRef.current) onExpire?.();
          onDismiss(id);
        }}
        aria-label="Dismiss"
        className="shrink-0 rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-white/10 hover:text-fg"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  );
}
