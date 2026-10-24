export interface CanvasBounds {
  width: number;
  height: number;
}

const STORAGE_KEY = "taskify:canvasBounds";

// Bigger than a typical viewport, so there's room to pan around before
// hitting the wall right away.
export const DEFAULT_CANVAS_BOUNDS: CanvasBounds = { width: 2400, height: 1600 };

export function loadCanvasBounds(): CanvasBounds {
  if (typeof window === "undefined") return DEFAULT_CANVAS_BOUNDS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CANVAS_BOUNDS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CANVAS_BOUNDS, ...parsed };
  } catch {
    return DEFAULT_CANVAS_BOUNDS;
  }
}

export function saveCanvasBounds(bounds: CanvasBounds): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bounds));
  } catch {
    // Storage full or blocked (private mode) - the layout just won't persist.
  }
}
