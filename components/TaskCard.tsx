"use client";

import { motion, type MotionValue } from "motion/react";
import { useMemo, useState } from "react";
import { getDueStatus, formatDueDate } from "@/lib/date";
import { getIdleParams, getProjectColor } from "@/lib/hash";
import type { Task } from "@/lib/types";

const DUE_STYLES: Record<string, string> = {
  overdue: "text-rose-300 bg-rose-400/15 ring-rose-400/30",
  soon: "text-amber-300 bg-amber-400/15 ring-amber-400/30",
  normal: "text-zinc-400 bg-white/5 ring-white/10",
};

export function TaskCard({
  task,
  onToggleComplete,
  x,
  y,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  task: Task;
  onToggleComplete: (id: string) => void;
  x: MotionValue<number>;
  y: MotionValue<number>;
  onDragStart: () => void;
  onDragMove: (clientX: number, clientY: number) => void;
  onDragEnd: () => void;
}) {
  const idle = useMemo(() => getIdleParams(task.id), [task.id]);
  const color = useMemo(() => getProjectColor(task.project), [task.project]);
  const dueStatus = getDueStatus(task.dueDate, task.completed);
  const [isDragging, setIsDragging] = useState(false);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    onDragStart();
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    onDragMove(e.clientX, e.clientY);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    onDragEnd();
  }

  return (
    <motion.div
      className="absolute left-0 top-0 cursor-grab touch-none select-none active:cursor-grabbing"
      style={{ x, y, zIndex: isDragging ? 50 : 1, scale: isDragging ? 1.05 : 1 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="w-64 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={{ y: [0, -idle.amplitude, 0] }}
          transition={{
            duration: idle.duration,
            delay: idle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div
            className={`rounded-2xl border border-white/10 bg-zinc-800/80 p-4 shadow-xl shadow-black/30 backdrop-blur-md transition-opacity ${
              task.completed ? "opacity-50" : ""
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span
                className={`truncate rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${color.text} ${color.bg} ${color.ring}`}
              >
                {task.project || "General"}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${DUE_STYLES[dueStatus]}`}
              >
                {formatDueDate(task.dueDate)}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onToggleComplete(task.id)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  task.completed
                    ? "border-emerald-400 bg-emerald-400/90 text-zinc-900"
                    : "border-zinc-500 hover:border-zinc-300"
                }`}
                aria-label={task.completed ? "Mark as not finished" : "Mark as finished"}
              >
                {task.completed && (
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                    <path
                      d="M2.5 6.5L4.75 8.75L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <p
                className={`text-sm font-semibold text-zinc-100 ${
                  task.completed ? "line-through text-zinc-400" : ""
                }`}
              >
                {task.title}
              </p>
            </div>

            {task.description && (
              <p className="mt-1.5 pl-7 text-xs leading-relaxed text-zinc-400 line-clamp-3">
                {task.description}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
