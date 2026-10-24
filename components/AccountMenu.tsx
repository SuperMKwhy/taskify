"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { api } from "@/lib/api";

interface Me {
  username: string;
  email: string;
}

export function AccountMenu() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<Me>("/api/auth/me")
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }

  if (!me) return <div className="skeleton h-10 w-10 rounded-full" aria-hidden />;

  return (
    <div ref={rootRef} className="relative" onPointerDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${me.username}`}
        className="glass flex h-10 items-center gap-2 rounded-full pl-1 pr-1 transition-colors hover:bg-white/15 sm:pr-3.5"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(140deg,var(--pool-pending),var(--pool-finished))] text-sm font-semibold uppercase text-ink-950">
          {me.username.slice(0, 1)}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-medium text-fg sm:block">{me.username}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            style={{ transformOrigin: "top right" }}
            className="glass-strong absolute right-0 top-12 w-64 rounded-2xl p-1.5"
          >
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-fg">{me.username}</p>
              <p className="truncate text-xs text-fg-subtle">{me.email}</p>
            </div>
            <div className="mx-1.5 my-1 h-px bg-white/10" />
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-fg-muted transition-colors hover:bg-white/10 hover:text-fg disabled:opacity-60"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 13.5H3.5a1 1 0 01-1-1v-9a1 1 0 011-1H6M10.5 11l3-3-3-3M13.5 8H6" />
              </svg>
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
