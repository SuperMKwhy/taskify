"use client";

import { useState } from "react";

export function ZoneLabel({
  label,
  x,
  y,
  onDrag,
}: {
  label: string;
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
        className="pointer-events-none absolute select-none whitespace-nowrap text-6xl font-bold uppercase tracking-widest text-white/[0.06]"
        style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
      >
        {label}
      </div>

      {/* Small grab handle at the same point - stays above cards so the zone is
          always movable even once it's buried under a cluster. */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        title={`Move the ${label} zone`}
        className={`absolute flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
          isDragging
            ? "cursor-grabbing border-white/40 bg-white/10"
            : "cursor-grab border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10"
        }`}
        style={{
          left: x,
          top: y,
          transform: "translate(-50%, -50%)",
          touchAction: "none",
          zIndex: 100,
        }}
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4 text-white/50" fill="currentColor">
          <circle cx="4" cy="4" r="1.3" />
          <circle cx="8" cy="4" r="1.3" />
          <circle cx="12" cy="4" r="1.3" />
          <circle cx="4" cy="8" r="1.3" />
          <circle cx="8" cy="8" r="1.3" />
          <circle cx="12" cy="8" r="1.3" />
          <circle cx="4" cy="12" r="1.3" />
          <circle cx="8" cy="12" r="1.3" />
          <circle cx="12" cy="12" r="1.3" />
        </svg>
      </div>
    </>
  );
}
