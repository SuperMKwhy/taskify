"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Task } from "@/lib/types";
import { getDueStatus } from "@/lib/date";
import { Button, Kbd, Spinner, Wordmark } from "./ui";

const stop = (e: React.PointerEvent) => e.stopPropagation();

export function BoardHeader({ tasks, loading }: { tasks: Task[]; loading: boolean }) {
  let pending = 0;
  let overdue = 0;
  let today = 0;
  for (const t of tasks) {
    if (t.completed) continue;
    pending++;
    const s = getDueStatus(t.dueDate, false);
    if (s === "overdue") overdue++;
    else if (s === "today") today++;
  }

  return (
    <div
      onPointerDown={stop}
      className="glass fixed left-4 top-4 z-40 flex h-12 items-center gap-3 rounded-full pl-3 pr-4 sm:left-6 sm:top-6"
    >
      <Wordmark />
      <span aria-hidden className="h-5 w-px bg-white/15" />
      {loading ? (
        <span className="skeleton h-3 w-24 rounded-full" aria-label="Loading" />
      ) : (
        <p className="flex items-center gap-3 text-[13px] text-fg-muted" aria-live="polite">
          <span>
            <strong className="font-semibold tabular-nums text-fg">{pending}</strong> pending
          </span>
          {overdue > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-danger" aria-hidden />
              <strong className="font-semibold tabular-nums text-[oklch(0.86_0.1_18)]">{overdue}</strong>
              overdue
            </span>
          )}
          {today > 0 && (
            <span className="hidden items-center gap-1.5 md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />
              <strong className="font-semibold tabular-nums text-[oklch(0.9_0.11_75)]">{today}</strong> due today
            </span>
          )}
        </p>
      )}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
      <div className="glass flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm text-fg-muted">
        <Spinner />
        Loading your board…
      </div>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const [retrying, setRetrying] = useState(false);
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center p-4">
      <div onPointerDown={stop} className="glass-strong pointer-events-auto w-full max-w-sm rounded-[28px] p-6 text-center">
        <h2 className="text-lg font-semibold text-fg">Couldn&apos;t load your board</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
          The server didn&apos;t respond. Your tasks are safe. Check your connection and try again.
        </p>
        <Button
          variant="primary"
          className="mt-5 w-full"
          loading={retrying}
          onClick={async () => {
            setRetrying(true);
            onRetry();
          }}
        >
          Try again
        </Button>
      </div>
    </div>
  );
}

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center p-4">
      <motion.div
        onPointerDown={stop}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong pointer-events-auto w-full max-w-md rounded-[28px] p-7"
      >
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-fg">Your board is empty</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">
          Every task floats here as a card. Unfinished cards drift toward the{" "}
          <span className="font-medium text-[oklch(0.86_0.1_50)]">Pending</span> light, finished ones glide over
          to <span className="font-medium text-[oklch(0.88_0.09_175)]">Finished</span>, and cards from the same project
          stick together.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button variant="primary" onClick={onAdd}>
            Add your first task
          </Button>
          <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
            or press <Kbd>N</Kbd>
          </span>
        </div>
      </motion.div>
    </div>
  );
}

const HINT_KEY = "taskify:hintDismissed";

/** One-time orientation for the canvas gestures. */
export function GestureHint({ show }: { show: boolean }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(window.localStorage.getItem(HINT_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(HINT_KEY, "1");
    } catch {
      // Not persisting is fine - it just shows again next visit.
    }
  }

  return (
    <AnimatePresence>
      {show && !dismissed && (
        <motion.div
          onPointerDown={stop}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 1.2, duration: 0.5 } }}
          exit={{ opacity: 0, y: -6 }}
          className="glass fixed left-1/2 top-6 z-30 hidden -translate-x-1/2 items-center gap-4 rounded-full py-1.5 pl-4 pr-1.5 text-xs text-fg-muted xl:flex"
        >
          <span>Drag the background to pan</span>
          <span aria-hidden className="h-3 w-px bg-white/15" />
          <span>Pinch or ⌘ + scroll to zoom</span>
          <span aria-hidden className="h-3 w-px bg-white/15" />
          <span>Click a card to edit</span>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full px-3 py-1.5 font-medium text-fg transition-colors hover:bg-white/10"
          >
            Got it
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
