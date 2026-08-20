"use client";

import { useEffect, useRef, useState } from "react";
import type { Task } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { GridBackdrop } from "./GridBackdrop";
import { ZoneLabel } from "./ZoneLabel";
import { ReactionLine } from "./ReactionLine";
import { CardLinkLine } from "./CardLinkLine";
import { PhysicsCalibrationPanel } from "./PhysicsCalibrationPanel";
import { useCardPhysics, DEFAULT_CALIBRATION, type PhysicsCalibration } from "@/hooks/useCardPhysics";
import {
  DEFAULT_ZONE_FRACTIONS,
  loadZoneFractions,
  saveZoneFractions,
  type ZoneFractions,
} from "@/lib/zoneStorage";
import {
  DEFAULT_CANVAS_BOUNDS,
  loadCanvasBounds,
  saveCanvasBounds,
  type CanvasBounds,
} from "@/lib/canvasBoundsStorage";

const ZONE_MARGIN_FRACTION = 0.08;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.5;
const ZOOM_SENSITIVITY = 0.0015;
const MAX_CANVAS_EXTENT = 8000;

interface Camera {
  x: number;
  y: number;
  zoom: number;
}

const DEFAULT_CAMERA: Camera = { x: 0, y: 0, zoom: 1 };

export function Canvas({
  tasks,
  onToggleComplete,
  onEditTask,
}: {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onEditTask: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Fixed fallback so the client's first render matches the server's exactly
  // (no `window` on the server) - the ResizeObserver corrects it right after
  // mount, before the physics simulation or zone labels are visible.
  const [size, setSize] = useState({ width: 1200, height: 800 });

  const [zoneFractions, setZoneFractions] = useState<ZoneFractions>(DEFAULT_ZONE_FRACTIONS);
  const [zonesHydrated, setZonesHydrated] = useState(false);

  const [canvasBounds, setCanvasBounds] = useState<CanvasBounds>(DEFAULT_CANVAS_BOUNDS);
  const [boundsHydrated, setBoundsHydrated] = useState(false);
  const boundsResizeRef = useRef<{ pointerId: number } | null>(null);

  const [camera, setCamera] = useState<Camera>(DEFAULT_CAMERA);
  const [isPanning, setIsPanning] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [calibration, setCalibration] = useState<PhysicsCalibration>(DEFAULT_CALIBRATION);
  const panRef = useRef<{ pointerId: number; startX: number; startY: number; camX: number; camY: number } | null>(
    null
  );

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanvasBounds(loadCanvasBounds());
    setBoundsHydrated(true);
  }, []);

  useEffect(() => {
    if (boundsHydrated) saveCanvasBounds(canvasBounds);
  }, [canvasBounds, boundsHydrated]);

  // The wall can never be smaller than the visible viewport, so resizing the
  // window can't strand cards (or the camera) outside it.
  const boundsWidth = Math.max(canvasBounds.width, size.width);
  const boundsHeight = Math.max(canvasBounds.height, size.height);

  const zones = {
    pendingX: zoneFractions.pendingX * boundsWidth,
    pendingY: zoneFractions.pendingY * boundsHeight,
    finishedX: zoneFractions.finishedX * boundsWidth,
    finishedY: zoneFractions.finishedY * boundsHeight,
    width: boundsWidth,
    height: boundsHeight,
  };

  const physics = useCardPhysics(tasks, zones, devMode, calibration);

  // Converts a screen-space point to world space, undoing the camera's pan/zoom
  // so drag math (zone fractions, physics targets) stays independent of the view.
  function toLocalPoint(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    const sx = clientX - (rect?.left ?? 0);
    const sy = clientY - (rect?.top ?? 0);
    return {
      x: (sx - camera.x) / camera.zoom,
      y: (sy - camera.y) / camera.zoom,
    };
  }

  function handleBackgroundPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (panRef.current) return;
    panRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      camX: camera.x,
      camY: camera.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPanning(true);
  }

  function handleBackgroundPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== e.pointerId) return;
    setCamera((prev) => ({
      ...prev,
      x: pan.camX + (e.clientX - pan.startX),
      y: pan.camY + (e.clientY - pan.startY),
    }));
  }

  function handleBackgroundPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (panRef.current?.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    panRef.current = null;
    setIsPanning(false);
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Trackpad pinch gestures (and ctrl+scroll) arrive as wheel events with
      // ctrlKey set - zoom around the cursor so the point under it stays put.
      const rect = containerRef.current?.getBoundingClientRect();
      const cx = e.clientX - (rect?.left ?? 0);
      const cy = e.clientY - (rect?.top ?? 0);
      setCamera((prev) => {
        const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY);
        const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * factor));
        const worldX = (cx - prev.x) / prev.zoom;
        const worldY = (cy - prev.y) / prev.zoom;
        return {
          zoom: nextZoom,
          x: cx - worldX * nextZoom,
          y: cy - worldY * nextZoom,
        };
      });
    } else {
      setCamera((prev) => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  }

  function moveZone(zone: "pending" | "finished", clientX: number, clientY: number) {
    const p = toLocalPoint(clientX, clientY);
    const fx = Math.min(
      1 - ZONE_MARGIN_FRACTION,
      Math.max(ZONE_MARGIN_FRACTION, boundsWidth ? p.x / boundsWidth : 0.5)
    );
    const fy = Math.min(
      1 - ZONE_MARGIN_FRACTION,
      Math.max(ZONE_MARGIN_FRACTION, boundsHeight ? p.y / boundsHeight : 0.5)
    );
    setZoneFractions((prev) => ({
      ...prev,
      [`${zone}X`]: fx,
      [`${zone}Y`]: fy,
    }));
  }

  function handleBoundsHandlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    boundsResizeRef.current = { pointerId: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleBoundsHandlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (boundsResizeRef.current?.pointerId !== e.pointerId) return;
    const p = toLocalPoint(e.clientX, e.clientY);
    setCanvasBounds({
      width: Math.min(MAX_CANVAS_EXTENT, Math.max(size.width, p.x)),
      height: Math.min(MAX_CANVAS_EXTENT, Math.max(size.height, p.y)),
    });
  }

  function handleBoundsHandlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (boundsResizeRef.current?.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    boundsResizeRef.current = null;
  }

  return (
    <GridBackdrop
      ref={containerRef}
      className={isPanning ? "cursor-grabbing" : "cursor-grab"}
      style={{ touchAction: "none" }}
      gridOffset={camera}
      gridZoom={camera.zoom}
      onPointerDown={handleBackgroundPointerDown}
      onPointerMove={handleBackgroundPointerMove}
      onPointerUp={handleBackgroundPointerUp}
      onPointerCancel={handleBackgroundPointerUp}
      onWheel={handleWheel}
    >
      {tasks.length === 0 && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 text-center text-sm text-zinc-500">
          No tasks yet. Add one to get started.
        </div>
      )}

      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: "0 0",
        }}
      >
        <div
          className="pointer-events-none absolute border-2 border-red-500/70"
          style={{ left: 0, top: 0, width: boundsWidth, height: boundsHeight }}
        />
        <div
          onPointerDown={handleBoundsHandlePointerDown}
          onPointerMove={handleBoundsHandlePointerMove}
          onPointerUp={handleBoundsHandlePointerUp}
          onPointerCancel={handleBoundsHandlePointerUp}
          title="Drag to extend the canvas"
          className="absolute flex h-8 w-8 cursor-nwse-resize items-center justify-center rounded-full border border-red-400/60 bg-red-500/20 text-red-300 transition-colors hover:bg-red-500/30"
          style={{
            left: boundsWidth,
            top: boundsHeight,
            transform: "translate(-50%, -50%)",
            touchAction: "none",
            zIndex: 100,
          }}
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
            <path
              d="M3 13L13 3M13 3H7M13 3V9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

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

        {devMode && (
          <svg
            className="pointer-events-none absolute left-0 top-0 overflow-visible"
            width={boundsWidth}
            height={boundsHeight}
          >
            {tasks.flatMap((taskA, i) =>
              tasks.slice(i + 1).map((taskB) => {
                if (taskB.completed !== taskA.completed) return null;
                const mvA = physics.getMotionValues(taskA.id);
                const mvB = physics.getMotionValues(taskB.id);
                const pair = physics.getPairReactionMotionValues(taskA.id, taskB.id);
                return (
                  <CardLinkLine
                    key={`link-${taskA.id}-${taskB.id}`}
                    x1={mvA.x}
                    y1={mvA.y}
                    x2={mvB.x}
                    y2={mvB.y}
                    colorT={pair.colorT}
                    distance={pair.distance}
                  />
                );
              })
            )}

            {tasks.map((task) => {
              const mv = physics.getMotionValues(task.id);
              const reaction = physics.getReactionMotionValues(task.id);
              const target = task.completed
                ? { x: zones.finishedX, y: zones.finishedY }
                : { x: zones.pendingX, y: zones.pendingY };
              return (
                <ReactionLine
                  key={`reaction-${task.id}`}
                  x1={target.x}
                  y1={target.y}
                  x2={mv.x}
                  y2={mv.y}
                  length={reaction.length}
                  colorT={reaction.colorT}
                />
              );
            })}
          </svg>
        )}

        {tasks.map((task) => {
          const mv = physics.getMotionValues(task.id);
          return (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEditTask}
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
      </div>

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setDevMode((prev) => !prev)}
        aria-pressed={devMode}
        title="Toggle physics debug mode"
        className={`fixed bottom-8 right-28 z-40 flex h-14 w-14 items-center justify-center rounded-full text-xs font-bold tracking-wide shadow-lg shadow-black/40 transition-colors ${
          devMode
            ? "bg-red-500 text-white hover:bg-red-400"
            : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
        }`}
      >
        DEV
      </button>

      {devMode && <PhysicsCalibrationPanel calibration={calibration} onChange={setCalibration} />}
    </GridBackdrop>
  );
}
