export function hashString(input: string, salt = ""): number {
  const str = salt + input;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** [0, 1) pseudo-random value, stable per (id, salt) pair. */
function unit(id: string, salt: string): number {
  return (hashString(id, salt) % 10000) / 10000;
}

/**
 * Stable jitter offset from a zone center, used only to pick a task's initial
 * spawn point so new cards don't all pop in stacked on the exact same pixel.
 */
export function getSpawnJitter(id: string): { x: number; y: number } {
  const angle = unit(id, "angle") * Math.PI * 2;
  const radius = 20 + unit(id, "radius") * 70;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

/** Stable idle-float animation params, so each card bobs slightly differently. */
export function getIdleParams(id: string) {
  return {
    duration: 4.5 + unit(id, "duration") * 3,
    delay: unit(id, "delay") * 2,
    amplitude: 3 + unit(id, "amplitude") * 3,
  };
}

// Hues (oklch) spaced so neighbouring projects never read as the same colour,
// and kept clear of the warm Pending / cool Finished light pools.
const PROJECT_HUES = [250, 300, 145, 85, 200, 335, 25];

export function getProjectHue(project: string): number {
  return PROJECT_HUES[hashString(project, "project") % PROJECT_HUES.length];
}
