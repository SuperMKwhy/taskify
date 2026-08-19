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
    duration: 3.5 + unit(id, "duration") * 2.5,
    delay: unit(id, "delay") * 2,
    amplitude: 6 + unit(id, "amplitude") * 6,
  };
}

const PROJECT_COLORS = [
  { text: "text-sky-300", bg: "bg-sky-400/15", ring: "ring-sky-400/30" },
  { text: "text-emerald-300", bg: "bg-emerald-400/15", ring: "ring-emerald-400/30" },
  { text: "text-violet-300", bg: "bg-violet-400/15", ring: "ring-violet-400/30" },
  { text: "text-amber-300", bg: "bg-amber-400/15", ring: "ring-amber-400/30" },
  { text: "text-rose-300", bg: "bg-rose-400/15", ring: "ring-rose-400/30" },
  { text: "text-cyan-300", bg: "bg-cyan-400/15", ring: "ring-cyan-400/30" },
  { text: "text-fuchsia-300", bg: "bg-fuchsia-400/15", ring: "ring-fuchsia-400/30" },
];

export function getProjectColor(project: string) {
  const idx = hashString(project, "project") % PROJECT_COLORS.length;
  return PROJECT_COLORS[idx];
}
