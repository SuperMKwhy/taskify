"use client";

export function AddTaskButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      title="New task (N)"
      className="fixed bottom-6 right-4 z-40 flex h-12 items-center gap-2.5 rounded-full bg-fg pl-4 pr-4 text-sm font-semibold text-ink-950 shadow-[0_14px_34px_-12px_oklch(0.85_0.08_175/0.65),0_2px_6px_-2px_oklch(0.1_0.04_275/0.6)] transition-[transform,background-color] duration-150 hover:bg-white active:scale-[0.97] sm:right-6 sm:pr-2.5"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      New task
      <span className="hidden sm:inline-flex">
        <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-ink-950/10 px-1.5 font-sans text-[11px] font-semibold text-ink-950/70">
          N
        </kbd>
      </span>
    </button>
  );
}
