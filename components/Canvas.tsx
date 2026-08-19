"use client";

import { useEffect, useRef, useState } from "react";
import type { Task } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { GridBackdrop } from "./GridBackdrop";
import { ZoneLabel } from "./ZoneLabel";
import { useCardPhysics } from "@/hooks/useCardPhysics";
import {
  DEFAULT_ZONE_FRACTIONS,
  loadZoneFractions,
  saveZoneFractions,
  type ZoneFractions,
} from "@/lib/zoneStorage";

const ZONE_MARGIN_FRACTION = 0.08;

export function Canvas({
  tasks,
  onToggleComplete,
}: {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Fixed fallback so the client's first render matches the server's exactly
  // (no `window` on the server) - the ResizeObserver corrects it right after
  // mount, before the physics simulation or zone labels are visible.
  const [size, setSize] = useState({ width: 1200, height: 800 });

  const [zoneFractions, setZoneFractions] = useState<ZoneFractions>(DEFAULT_ZONE_FRACTIONS);
  const [zonesHydrated, setZonesHydrated] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Reading localStorage during render would cause an SSR hydration mismatch,
    // so the saved zone layout is loaded once on mount instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoneFractions(loadZoneFractions());
    setZonesHydrated(true);
  }, []);

  useEffect(() => {
    if (zonesHydrated) saveZoneFractions(zoneFractions);
  }, [zoneFractions, zonesHydrated]);

  const zones = {
    pendingX: zoneFractions.pendingX * size.width,
    pendingY: zoneFractions.pendingY * size.height,
    finishedX: zoneFractions.finishedX * size.width,
    finishedY: zoneFractions.finishedY * size.height,
    width: size.width,
    height: size.height,
  };

  const physics = useCardPhysics(tasks, zones);

  function toLocalPoint(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    return {
      x: clientX - (rect?.left ?? 0),
      y: clientY - (rect?.top ?? 0),
    };
  }

  function moveZone(zone: "pending" | "finished", clientX: number, clientY: number) {
    const p = toLocalPoint(clientX, clientY);
    const fx = Math.min(
      1 - ZONE_MARGIN_FRACTION,
      Math.max(ZONE_MARGIN_FRACTION, size.width ? p.x / size.width : 0.5)
    );
    const fy = Math.min(
      1 - ZONE_MARGIN_FRACTION,
      Math.max(ZONE_MARGIN_FRACTION, size.height ? p.y / size.height : 0.5)
    );
    setZoneFractions((prev) => ({
      ...prev,
      [`${zone}X`]: fx,
      [`${zone}Y`]: fy,
    }));
  }

  return (
    <GridBackdrop ref={containerRef}>
      <ZoneLabel
        label="Pending"
        x={zones.pendingX}
        y={zones.pendingY}
        onDrag={(clientX, clientY) => moveZone("pending", clientX, clientY)}
      />
      <ZoneLabel
        label="Finished"
        x={zones.finishedX}
        y={zones.finishedY}
        onDrag={(clientX, clientY) => moveZone("finished", clientX, clientY)}
      />

      {tasks.length === 0 && (
        <div className="absolute left-1/2 top-1/2 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 text-center text-sm text-zinc-500">
          No tasks yet. Add one to get started.
        </div>
      )}

      {tasks.map((task) => {
        const mv = physics.getMotionValues(task.id);
        return (
          <TaskCard
            key={task.id}
            task={task}
            onToggleComplete={onToggleComplete}
            x={mv.x}
            y={mv.y}
            onDragStart={() => physics.beginDrag(task.id)}
            onDragMove={(clientX, clientY) => {
              const p = toLocalPoint(clientX, clientY);
              physics.dragTo(task.id, p.x, p.y);
            }}
            onDragEnd={() => physics.endDrag(task.id)}
          />
        );
      })}
    </GridBackdrop>
  );
}
