"use client";

const stop = (e: React.PointerEvent) => e.stopPropagation();

export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
  debug,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  debug?: { active: boolean; onToggle: () => void };
}) {
  return (
    <div
      onPointerDown={stop}
      data-no-canvas-wheel
      className="fixed bottom-6 left-4 z-40 flex items-center gap-2 sm:left-6"
    >
      <div role="group" aria-label="Zoom" className="glass flex items-center rounded-full p-1">
        <IconButton label="Zoom out (−)" onClick={onZoomOut}>
          <path d="M4 8h8" />
        </IconButton>
        <button
          type="button"
          onClick={onFit}
          title="Fit board to screen (0)"
          className="h-8 min-w-14 rounded-full px-2 text-xs font-medium tabular-nums text-fg-muted transition-colors hover:bg-white/10 hover:text-fg"
        >
          {Math.round(zoom * 100)}%
        </button>
        <IconButton label="Zoom in (+)" onClick={onZoomIn}>
          <path d="M4 8h8M8 4v8" />
        </IconButton>
      </div>

      <button
        type="button"
        onClick={onFit}
        aria-label="Fit board"
        className="glass flex h-10 items-center gap-2 rounded-full px-3 text-xs font-medium text-fg-muted transition-colors hover:bg-white/15 hover:text-fg sm:px-4"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M2.5 6V3.5a1 1 0 011-1H6M10 2.5h2.5a1 1 0 011 1V6M13.5 10v2.5a1 1 0 01-1 1H10M6 13.5H3.5a1 1 0 01-1-1V10" />
        </svg>
        <span className="hidden sm:inline">Fit board</span>
      </button>

      {debug && (
        <button
          type="button"
          onClick={debug.onToggle}
          aria-pressed={debug.active}
          title="Physics debug overlay (Shift+D)"
          className={`glass h-10 rounded-full px-3.5 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors ${
            debug.active ? "bg-danger/30 text-fg" : "text-fg-subtle hover:text-fg"
          }`}
        >
          Debug
        </button>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-white/10 hover:text-fg"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
        {children}
      </svg>
    </button>
  );
}
