import { forwardRef } from "react";

const GRID_SIZE = 32;

/**
 * The ink ground every glass surface sits on: a faint dot grid that pans and
 * scales with the camera, plus a soft ambient wash so glass always has some
 * light to refract even far from the zone pools.
 */
export const GridBackdrop = forwardRef<
  HTMLDivElement,
  {
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    gridOffset?: { x: number; y: number };
    gridZoom?: number;
    onPointerDown?: React.PointerEventHandler<HTMLDivElement>;
    onPointerMove?: React.PointerEventHandler<HTMLDivElement>;
    onPointerUp?: React.PointerEventHandler<HTMLDivElement>;
    onPointerCancel?: React.PointerEventHandler<HTMLDivElement>;
    onWheel?: React.WheelEventHandler<HTMLDivElement>;
  }
>(function GridBackdrop(
  {
    children,
    className = "",
    style,
    gridOffset = { x: 0, y: 0 },
    gridZoom = 1,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onWheel,
  },
  ref
) {
  const size = GRID_SIZE * gridZoom;
  return (
    <div
      ref={ref}
      className={`relative h-dvh w-full overflow-hidden bg-ink-950 ${className}`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onWheel={onWheel}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 15% 0%, oklch(0.3 0.08 285 / 0.55), transparent 60%), radial-gradient(90% 70% at 100% 100%, oklch(0.28 0.07 230 / 0.5), transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, oklch(1 0 0 / ${gridZoom < 0.6 ? 0.07 : 0.1}) ${Math.max(0.8, gridZoom)}px, transparent ${Math.max(1, gridZoom * 1.2)}px)`,
          backgroundSize: `${size}px ${size}px`,
          backgroundPosition: `${gridOffset.x}px ${gridOffset.y}px`,
        }}
      />
      {children}
    </div>
  );
});
