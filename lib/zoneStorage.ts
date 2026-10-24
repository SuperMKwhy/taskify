export interface ZoneFractions {
  pendingX: number;
  pendingY: number;
  finishedX: number;
  finishedY: number;
}

const STORAGE_KEY = "taskify:zones";

export const DEFAULT_ZONE_FRACTIONS: ZoneFractions = {
  pendingX: 0.32,
  pendingY: 0.5,
  finishedX: 0.68,
  finishedY: 0.5,
};

export function loadZoneFractions(): ZoneFractions {
  if (typeof window === "undefined") return DEFAULT_ZONE_FRACTIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ZONE_FRACTIONS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ZONE_FRACTIONS, ...parsed };
  } catch {
    return DEFAULT_ZONE_FRACTIONS;
  }
}

export function saveZoneFractions(fractions: ZoneFractions): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fractions));
  } catch {
    // Storage full or blocked (private mode) - the layout just won't persist.
  }
}
