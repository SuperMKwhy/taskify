"use client";

import { forwardRef, useId, useState } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-fg text-ink-950 shadow-[0_8px_24px_-10px_oklch(0.9_0.05_175/0.6)] hover:bg-white disabled:bg-fg/60",
  secondary: "glass text-fg hover:bg-white/15",
  ghost: "text-fg-muted hover:bg-white/10 hover:text-fg",
  danger: "text-danger hover:bg-danger/15",
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean }
>(function Button({ variant = "secondary", loading, className = "", children, disabled, ...rest }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-[background-color,color,transform,box-shadow] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${BUTTON_STYLES[variant]} ${className}`}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`${className} animate-spin`} fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Field({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const message = error || hint;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-fg-muted">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-fg-subtle">Optional</span>}
      </label>
      {children({ id, describedBy: message ? hintId : undefined, invalid: Boolean(error) })}
      {message && (
        <p id={hintId} className={`mt-1.5 text-xs ${error ? "text-danger" : "text-fg-subtle"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export const INPUT_CLASS =
  "glass-field block h-11 w-full rounded-xl px-3.5 text-[15px] text-fg disabled:opacity-60";

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = "", ...rest }, ref) {
    return <input ref={ref} className={`${INPUT_CLASS} ${className}`} {...rest} />;
  }
);

export function PasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${INPUT_CLASS} pr-16`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-lg px-2.5 text-xs font-medium text-fg-subtle transition-colors hover:bg-white/10 hover:text-fg"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-danger/35 bg-danger/12 px-3.5 py-2.5 text-sm text-[oklch(0.88_0.07_18)]"
    >
      <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-danger" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.75v3.75M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-white/15 bg-white/8 px-1.5 font-sans text-[11px] font-medium text-fg-muted">
      {children}
    </kbd>
  );
}

/** Brand mark: a glass tile catching warm and cool light, with a tick. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 64 64" className="h-7 w-7 shrink-0" aria-hidden>
        <defs>
          <radialGradient id="wm-warm" cx="30%" cy="35%" r="60%">
            <stop offset="0" stopColor="#ff9b5c" />
            <stop offset="1" stopColor="#ff9b5c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="wm-cool" cx="75%" cy="70%" r="60%">
            <stop offset="0" stopColor="#4fd6bd" />
            <stop offset="1" stopColor="#4fd6bd" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="#1b1c3a" />
        <rect width="64" height="64" rx="16" fill="url(#wm-warm)" />
        <rect width="64" height="64" rx="16" fill="url(#wm-cool)" />
        <rect x="14" y="16" width="36" height="32" rx="9" fill="#fff" fillOpacity="0.18" stroke="#fff" strokeOpacity="0.45" />
        <path d="M23 32.5l6 6 12-13" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[17px] font-semibold tracking-[-0.01em] text-fg">Taskify</span>
    </span>
  );
}
