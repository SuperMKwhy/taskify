"use client";

export function AddTaskButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 shadow-lg shadow-black/40 transition-transform hover:scale-105 active:scale-95"
      aria-label="Add task"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
