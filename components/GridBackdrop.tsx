import { forwardRef } from "react";

const GRID_SIZE = 40;

export const GridBackdrop = forwardRef<
  HTMLDivElement,
  { children?: React.ReactNode; className?: string }
>(function GridBackdrop({ children, className = "" }, ref) {
  return (
    <div
      ref={ref}
      className={`relative h-dvh w-full overflow-hidden bg-zinc-900 ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, transparent 0%, rgba(24,24,27,0.55) 75%)",
        }}
      />
      {children}
    </div>
  );
});
