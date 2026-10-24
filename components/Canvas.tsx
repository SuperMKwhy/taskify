"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Task } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { GridBackdrop } from "./GridBackdrop";
import { ZoneLabel, ZonePool } from "./ZoneLabel";
import { ReactionLine } from "./ReactionLine";
import { CardLinkLine } from "./CardLinkLine";
import { PhysicsCalibrationPanel } from "./PhysicsCalibrationPanel";
import { ZoomControls } from "./ZoomControls";
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
const ZOOM_STEP = 1.25;
const MAX_CANVAS_EXTENT = 8000;
// Room a settled cluster takes up around its zone centre, used when fitting.
const ZONE_FIT_RADIUS = 300;
// Half a card's footprint, so fitting keeps whole cards on screen.
const CARD_HALF_W = 140;
const CARD_HALF_H = 90;
// Space kept clear for the header and the bottom controls when fitting.
const FIT_INSET = { top: 96, right: 40, bottom: 112, left: 40 };
const FIT_INSET_COMPACT = { top: 80, right: 12, bottom: 96, left: 12 };
const COMPACT_BREAKPOINT = 640;
// Below this, card text drops under ~10px on a phone; legibility wins over
// framing the whole cluster.
const COMPACT_MIN_FIT_ZOOM = 0.7;
// Roughly when a freshly loaded board's simulation has cooled.
const SETTLE_REFIT_DELAY_MS = 1800;

// The physics debug overlay is a developer tool: on in dev builds, or in
// production only when explicitly enabled.
const DEBUG_TOOLS_ENABLED =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_PHYSICS_DEBUG === "1";

interface Camera {
  x: number;
  y: number;
  zoom: number;
}

const DEFAULT_CAMERA: Camera = { x: 0, y: 0, zoom: 1 };

function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function Canvas({
  tasks,
  ready,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
}: {
  tasks: Task[];
  /** Tasks have loaded - the camera fits the board once this turns true. */
  ready: boolean;
  onToggleComplete: (id: string) => void;
  onEditTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Fixed fallback so the client's first render matches the server's exactly
  // (no `window` on the server) - the ResizeObserver corrects it right after
  // mount, before the physics simulation or zone labels are visible.
  const [size, setSize] = useState({ width: 1200, height: 800 });
  const [measured, setMeasured] = useState(false);

  const [zoneFractions, setZoneFractions] = useState<ZoneFractions>(DEFAULT_ZONE_FRACTIONS);
  const [zonesHydrated, setZonesHydrated] = useState(false);

  const [canvasBounds, setCanvasBounds] = useState<CanvasBounds>(DEFAULT_CANVAS_BOUNDS);
  const [boundsHydrated, setBoundsHydrated] = useState(false);
  const boundsResizeRef = useRef<{ pointerId: number } | null>(null);

  const [camera, setCamera] = useState<Camera>(DEFAULT_CAMERA);
  const [cameraAnimated, setCameraAnimated] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [calibration, setCalibration] = useState<PhysicsCalibration>(DEFAULT_CALIBRATION);
  const panRef = useRef<{ pointerId: number; startX: number; startY: number; camX: number; camY: number } | null>(
    null
  );
  const [hasFitted, setHasFitted] = useState(false);
  const userMovedCameraRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
        setMeasured(true);
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

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const finishedCount = tasks.length - pendingCount;

  // Frames both zones plus every card on the board. On phone-width screens
  // that would shrink cards past legibility, so it frames the Pending
  // cluster instead and leaves Finished a pan away.
  const fitToBoard = useCallback(
    (animate = true) => {
      const compact = size.width < COMPACT_BREAKPOINT;
      const inset = compact ? FIT_INSET_COMPACT : FIT_INSET;
      const zonePoints = compact
        ? [{ x: zones.pendingX, y: zones.pendingY }]
        : [
            { x: zones.pendingX, y: zones.pendingY },
            { x: zones.finishedX, y: zones.finishedY },
          ];
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const p of zonePoints) {
        minX = Math.min(minX, p.x - ZONE_FIT_RADIUS);
        maxX = Math.max(maxX, p.x + ZONE_FIT_RADIUS);
        minY = Math.min(minY, p.y - ZONE_FIT_RADIUS);
        maxY = Math.max(maxY, p.y + ZONE_FIT_RADIUS);
      }
      for (const task of tasks) {
        if (compact && task.completed) continue;
        const mv = physics.getMotionValues(task.id);
        minX = Math.min(minX, mv.x.get() - CARD_HALF_W);
        maxX = Math.max(maxX, mv.x.get() + CARD_HALF_W);
        minY = Math.min(minY, mv.y.get() - CARD_HALF_H);
        maxY = Math.max(maxY, mv.y.get() + CARD_HALF_H);
      }
      const availW = Math.max(200, size.width - inset.left - inset.right);
      const availH = Math.max(200, size.height - inset.top - inset.bottom);
      const fit = Math.min(availW / (maxX - minX), availH / (maxY - minY), 1);
      const zoom = clampZoom(compact ? Math.max(fit, COMPACT_MIN_FIT_ZOOM) : fit);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      setCameraAnimated(animate);
      setCamera({
        zoom,
        x: inset.left + availW / 2 - cx * zoom,
        y: inset.top + availH / 2 - cy * zoom,
      });
    },
    // physics accessors are stable reads from refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, size.width, size.height, zones.pendingX, zones.pendingY, zones.finishedX, zones.finishedY]
  );

  // Frame the board once the real viewport and the saved layout are known,
  // then once more (gently) after freshly spawned cards have settled -
  // unless the visitor has already taken the camera.
  useEffect(() => {
    if (hasFitted || !ready || !measured || !zonesHydrated || !boundsHydrated) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    fitToBoard(false);
    setHasFitted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [hasFitted, ready, measured, zonesHydrated, boundsHydrated, fitToBoard]);

  const fitToBoardRef = useRef(fitToBoard);
  useEffect(() => {
    fitToBoardRef.current = fitToBoard;
  });
  useEffect(() => {
    if (!hasFitted) return;
    const timer = window.setTimeout(() => {
      if (!userMovedCameraRef.current) fitToBoardRef.current(true);
    }, SETTLE_REFIT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [hasFitted]);

  function zoomAroundCenter(factor: number) {
    userMovedCameraRef.current = true;
    const cx = size.width / 2;
    const cy = size.height / 2;
    setCameraAnimated(true);
    setCamera((prev) => {
      const nextZoom = clampZoom(prev.zoom * factor);
      const worldX = (cx - prev.x) / prev.zoom;
      const worldY = (cy - prev.y) / prev.zoom;
      return { zoom: nextZoom, x: cx - worldX * nextZoom, y: cy - worldY * nextZoom };
    });
  }

  // Keyboard: +/- zoom, 0 fits the board, Shift+D toggles physics debug.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable], [role=dialog]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "=" || e.key === "+") zoomAroundCenter(ZOOM_STEP);
      else if (e.key === "-") zoomAroundCenter(1 / ZOOM_STEP);
      else if (e.key === "0") fitToBoard();
      else if (DEBUG_TOOLS_ENABLED && e.shiftKey && e.key.toLowerCase() === "d") setDevMode((p) => !p);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

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
    if (panRef.current || e.button !== 0) return;
    panRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      camX: camera.x,
      camY: camera.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    userMovedCameraRef.current = true;
    setCameraAnimated(false);
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

  // React's onWheel is passive, so preventDefault (to stop browser page zoom
  // on pinch) needs a native non-passive listener. It only touches state
  // setters, so it never goes stale.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      if ((e.target as HTMLElement | null)?.closest("[data-no-canvas-wheel]")) return;
      e.preventDefault();
      userMovedCameraRef.current = true;
      setCameraAnimated(false);
      if (e.ctrlKey || e.metaKey) {
        // Trackpad pinch gestures (and ctrl+scroll) arrive as wheel events with
        // ctrlKey set - zoom around the cursor so the point under it stays put.
        const rect = el!.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        setCamera((prev) => {
          const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY);
          const nextZoom = clampZoom(prev.zoom * factor);
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
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

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
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: "0 0",
          transition: cameraAnimated ? "transform 420ms var(--ease-out-expo)" : undefined,
          // Hidden until the first fit so the board never flashes at the
          // wrong framing. (Never fade it: an ancestor with opacity < 1
          // cuts the cards' backdrop blur off from the light pools.)
          visibility: hasFitted ? "visible" : "hidden",
        }}
      >
        <ZonePool kind="pending" x={zones.pendingX} y={zones.pendingY} />
        <ZonePool kind="finished" x={zones.finishedX} y={zones.finishedY} />

        <div
          aria-hidden
          className="pointer-events-none absolute rounded-[32px] border border-dashed border-white/10"
          style={{ left: 0, top: 0, width: boundsWidth, height: boundsHeight }}
        />
        <div
          onPointerDown={handleBoundsHandlePointerDown}
          onPointerMove={handleBoundsHandlePointerMove}
          onPointerUp={handleBoundsHandlePointerUp}
          onPointerCancel={handleBoundsHandlePointerUp}
          title="Drag to resize the board"
          className="glass absolute flex h-9 w-9 cursor-nwse-resize items-center justify-center rounded-full text-fg-muted transition-colors hover:text-fg"
          style={{
            left: boundsWidth,
            top: boundsHeight,
            translate: "-50% -50%",
            touchAction: "none",
            zIndex: 100,
          }}
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
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
          kind="pending"
          label="Pending"
          count={pendingCount}
          x={zones.pendingX}
          y={zones.pendingY}
          onDrag={(clientX, clientY) => moveZone("pending", clientX, clientY)}
        />
        <ZoneLabel
          kind="finished"
          label="Finished"
          count={finishedCount}
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
              onDelete={onDeleteTask}
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

      <ZoomControls
        zoom={camera.zoom}
        onZoomIn={() => zoomAroundCenter(ZOOM_STEP)}
        onZoomOut={() => zoomAroundCenter(1 / ZOOM_STEP)}
        onFit={() => fitToBoard()}
        debug={
          DEBUG_TOOLS_ENABLED ? { active: devMode, onToggle: () => setDevMode((prev) => !prev) } : undefined
        }
      />

      {devMode && <PhysicsCalibrationPanel calibration={calibration} onChange={setCalibration} />}
    </GridBackdrop>
  );
}
