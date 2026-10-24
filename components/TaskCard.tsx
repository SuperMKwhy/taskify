"use client";

import { motion, useReducedMotion, type MotionValue } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { getDueStatus, formatDueDate, type DueStatus } from "@/lib/date";
import { getIdleParams, getProjectHue } from "@/lib/hash";
import type { Task } from "@/lib/types";

// Below this travel (px) a press counts as a click and opens the editor.
const CLICK_SLOP = 4;

const DUE_STYLES: Record<DueStatus, string> = {
  overdue: "text-[oklch(0.86_0.1_18)] bg-[oklch(0.65_0.2_18/0.28)] ring-[oklch(0.75_0.17_18/0.5)]",
  today: "text-[oklch(0.9_0.11_75)] bg-[oklch(0.75_0.15_75/0.22)] ring-[oklch(0.83_0.14_75/0.45)]",
  soon: "text-[oklch(0.9_0.09_75)] bg-[oklch(0.75_0.15_75/0.14)] ring-[oklch(0.83_0.14_75/0.3)]",
  normal: "text-fg-muted bg-white/5 ring-white/10",
};

export function TaskCard({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  x,
  y,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  x: MotionValue<number>;
  y: MotionValue<number>;
  onDragStart: () => void;
  onDragMove: (clientX: number, clientY: number) => void;
  onDragEnd: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const idle = useMemo(() => getIdleParams(task.id), [task.id]);
  const hue = useMemo(() => getProjectHue(task.project), [task.project]);
  const dueStatus = getDueStatus(task.dueDate, task.completed);
  const [isDragging, setIsDragging] = useState(false);
  const pressRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    pressRef.current = { x: e.clientX, y: e.clientY, moved: false };
    setIsDragging(true);
    onDragStart();
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const press = pressRef.current;
    if (!press) return;
    if (!press.moved && Math.hypot(e.clientX - press.x, e.clientY - press.y) > CLICK_SLOP) {
      press.moved = true;
    }
    onDragMove(e.clientX, e.clientY);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const wasClick = pressRef.current && !pressRef.current.moved && e.type === "pointerup";
    pressRef.current = null;
    setIsDragging(false);
    onDragEnd();
    if (wasClick) onEdit(task.id);
  }

  const stop = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <motion.div
      // Hovered/focused cards rise above the zone pills (z-100) so a pill can
      // never sit on top of a card's controls. Zero-size so this positioning
      // wrapper never becomes an invisible hit area beside the card.
      className={`absolute left-0 top-0 h-0 w-0 cursor-grab touch-none select-none active:cursor-grabbing ${
        isDragging ? "z-[150]" : "z-[1] hover:z-[140] focus-within:z-[140]"
      }`}
      style={{ x, y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="w-64 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={reduceMotion || isDragging ? { y: 0 } : { y: [0, -idle.amplitude, 0] }}
          transition={
            reduceMotion || isDragging
              ? { duration: 0.2 }
              : { duration: idle.duration, delay: idle.delay, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <motion.article
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: task.completed ? 0.62 : 1,
              scale: isDragging ? 1.04 : 1,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            aria-label={task.title}
            className={`glass group relative rounded-[20px] p-4 transition-shadow duration-300 ${
              isDragging ? "shadow-[var(--glass-shadow-lift)]" : ""
            }`}
          >
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <span
                className="inline-flex min-w-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1"
                style={{
                  color: `oklch(0.9 0.07 ${hue})`,
                  background: `oklch(0.7 0.12 ${hue} / 0.16)`,
                  ["--tw-ring-color" as string]: `oklch(0.78 0.12 ${hue} / 0.32)`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: `oklch(0.8 0.15 ${hue})` }}
                />
                <span className="truncate">{task.project || "General"}</span>
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ring-1 ${DUE_STYLES[dueStatus]}`}
                >
                  {formatDueDate(task.dueDate, task.completed)}
                </span>
                {/* Quick actions - revealed on hover/focus, always shown on touch. */}
                {/* Collapsed to zero width rather than display:none so the buttons stay
                    reachable by Tab - focusing one expands the row. */}
                <div className="-mr-1.5 flex w-0 overflow-hidden group-hover:w-auto group-focus-within:w-auto [@media(hover:none)]:w-auto">
                  <CardAction label={`Edit “${task.title}”`} onPointerDown={stop} onClick={() => onEdit(task.id)}>
                    <path
                      d="M11.5 2.5L13.5 4.5L5.5 12.5H3.5V10.5L11.5 2.5Z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </CardAction>
                  <CardAction
                    label={`Delete “${task.title}”`}
                    onPointerDown={stop}
                    onClick={() => onDelete(task.id)}
                    danger
                  >
                    <path
                      d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.1a1 1 0 001 .9h3.8a1 1 0 001-.9l.6-8.1"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </CardAction>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <button
                type="button"
                onPointerDown={stop}
                onClick={() => onToggleComplete(task.id)}
                className={`relative mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,transform] duration-200 active:scale-90 before:absolute before:-inset-2 before:content-[''] ${
                  task.completed
                    ? "border-success bg-success text-ink-950"
                    : "border-white/35 bg-white/5 hover:border-success hover:bg-success/15"
                }`}
                aria-label={task.completed ? `Mark “${task.title}” as not finished` : `Mark “${task.title}” as finished`}
                aria-pressed={task.completed}
              >
                {task.completed && (
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden>
                    <path
                      d="M2.5 6.5L4.75 8.75L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <p
                className={`min-w-0 flex-1 break-words text-[15px] font-semibold leading-snug ${
                  task.completed ? "text-fg-muted line-through decoration-white/40" : "text-fg"
                }`}
              >
                {task.title}
              </p>
            </div>

            {task.description && (
              <p className="mt-1.5 line-clamp-3 break-words pl-[30px] text-[13px] leading-relaxed text-fg-muted">
                {task.description}
              </p>
            )}

          </motion.article>
        </motion.div>
      </div>
    </motion.div>
  );
}

function CardAction({
  label,
  onClick,
  onPointerDown,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onClick={onClick}
      aria-label={label}
      title={label.split(" ")[0]}
      className={`flex h-6 w-6 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-white/10 ${
        danger ? "hover:text-danger" : "hover:text-fg"
      }`}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
        {children}
      </svg>
    </button>
  );
}
