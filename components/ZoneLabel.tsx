"use client";

import { useState } from "react";

export type ZoneKind = "pending" | "finished";

const POOL_DIAMETER = 1300;
// The word sits above the centre; the grab pill stays on the exact attractor
// point, which the pull spring keeps clear of cards.
const LABEL_OFFSET_Y = -64;

const POOLS: Record<ZoneKind, string> = {
  pending:
    "radial-gradient(closest-side, oklch(0.72 0.17 45 / 0.42), oklch(0.66 0.2 10 / 0.2) 45%, transparent 100%)",
  finished:
    "radial-gradient(closest-side, oklch(0.76 0.13 175 / 0.36), oklch(0.68 0.14 220 / 0.18) 45%, transparent 100%)",
};

const LABEL_COLOR: Record<ZoneKind, string> = {
  pending: "oklch(0.86 0.09 50 / 0.18)",
  finished: "oklch(0.88 0.08 175 / 0.18)",
};

/** Light pool drawn behind every card - the glass picks up its tint. */
export function ZonePool({ kind, x, y }: { kind: ZoneKind; x: number; y: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute rounded-full"
      style={{
        left: x,
        top: y,
        width: POOL_DIAMETER,
        height: POOL_DIAMETER,
        transform: "translate(-50%, -50%)",
        background: POOLS[kind],
      }}
    />
  );
}

export function ZoneLabel({
  kind,
  label,
  count,
  x,
  y,
  onDrag,
}: {
  kind: ZoneKind;
  label: string;
  count: number;
  x: number;
  y: number;
  onDrag: (clientX: number, clientY: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    onDrag(e.clientX, e.clientY);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  }

  return (
    <>
      {/* Decorative background label - never intercepts clicks, cards float over it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute select-none whitespace-nowrap text-center font-light uppercase"
        style={{
          left: x,
          top: y + LABEL_OFFSET_Y,
          transform: "translate(-50%, -50%)",
          color: LABEL_COLOR[kind],
          fontSize: 52,
          letterSpacing: "0.22em",
          lineHeight: 1,
        }}
      >
        {label}
      </div>

      {/* Grab handle at the zone's centre - stays above cards so the zone is
          always movable even once it's buried under a cluster. */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        title={`Drag to move the ${label} zone`}
        aria-label={`${label} zone, ${count} ${count === 1 ? "task" : "tasks"}`}
        className={`glass absolute flex h-9 items-center gap-1.5 rounded-full pl-2.5 pr-3 text-xs font-medium text-fg-muted transition-[background-color,transform] duration-200 ${
          isDragging ? "scale-105 cursor-grabbing" : "cursor-grab hover:bg-white/15"
        }`}
        style={{
          left: x,
          top: y,
          translate: "-50% -50%",
          touchAction: "none",
          zIndex: 100,
        }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: kind === "pending" ? "var(--pool-pending)" : "var(--pool-finished)" }}
        />
        <span className="text-fg">{label}</span>
        <span className="tabular-nums text-fg-subtle">{count}</span>
      </div>
    </>
  );
}
