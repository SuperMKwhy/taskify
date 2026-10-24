"use client";

import { useEffect, useRef } from "react";
import { forceSimulation, forceCollide, type Simulation } from "d3-force";
import { motionValue, type MotionValue } from "motion/react";
import { getSpawnJitter } from "@/lib/hash";
import type { Task } from "@/lib/types";

export interface Zones {
  pendingX: number;
  pendingY: number;
  finishedX: number;
  finishedY: number;
  width: number;
  height: number;
}

interface PhysicsNode {
  id: string;
  project: string;
  completed: boolean;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

// Three rules, each modeled as a spring: a neutral length (the rest distance
// where the force is exactly zero) plus a force intensity. Closer than the
// neutral length -> push apart; farther than it -> pull together.
//   1. pull to center    - card <-> its Pending/Finished point
//   2. card push         - card <-> card, universal, keeps cards from stacking
//   3. same project pull - card <-> card, only within the same project & zone
// Live-tunable via the dev-mode calibration panel.
export interface PhysicsCalibration {
  pullNeutralLength: number;
  pullIntensity: number;
  pushNeutralLength: number;
  pushIntensity: number;
  projectPullNeutralLength: number;
  projectPullIntensity: number;
}

export const DEFAULT_CALIBRATION: PhysicsCalibration = {
  pullNeutralLength: 220,
  pullIntensity: 0.03,
  pushNeutralLength: 135,
  pushIntensity: 1,
  projectPullNeutralLength: 170,
  projectPullIntensity: 0.6,
};

// How much (push - pull) magnitude maps to full-strength red/blue in dev mode.
const REACTION_COLOR_RANGE = 30;

export interface ReactionMotionValues {
  length: MotionValue<number>;
  colorT: MotionValue<number>;
}

export interface PairReactionMotionValues {
  distance: MotionValue<number>;
  colorT: MotionValue<number>;
}

function pairKey(idA: string, idB: string) {
  return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
}

// Spring between a node and a fixed target point. Negative when compressed
// (closer than the neutral length) -> pushes away; positive when stretched
// (farther) -> pulls toward. Zero exactly at the neutral length. Always
// applies, drag or not - dropping a card just gives it a new starting point.
function forcePullToTarget(
  getTarget: (node: PhysicsNode) => { x: number; y: number },
  calibrationRef: { current: PhysicsCalibration }
) {
  let nodes: PhysicsNode[] = [];

  function force(alpha: number) {
    const { pullNeutralLength, pullIntensity } = calibrationRef.current;
    for (const node of nodes) {
      const target = getTarget(node);
      const dx = target.x - node.x;
      const dy = target.y - node.y;
      const dist = Math.hypot(dx, dy) || 0.01;
      const k = ((dist - pullNeutralLength) / dist) * pullIntensity * alpha;
      node.vx = (node.vx ?? 0) + dx * k;
      node.vy = (node.vy ?? 0) + dy * k;
    }
  }

  force.initialize = (initializedNodes: PhysicsNode[]) => {
    nodes = initializedNodes;
  };

  return force;
}

// Cards never pull each other across different projects - only ever push,
// and only when they've gotten within this radius (a wider "different
// projects keep their distance" bubble than plain collision). This is what
// keeps two clusters from drifting through each other, without ever
// attracting them together.
const CROSS_PROJECT_PUSH_RADIUS_FACTOR = 1.8;

// Pairwise force between same-zone cards. Same project: a real spring - push
// apart if closer than the neutral length, pull together if farther.
// Different project: push-only within a wider radius, clamped so it can
// never flip into a pull.
function forceSameProjectPull(calibrationRef: { current: PhysicsCalibration }) {
  let nodes: PhysicsNode[] = [];

  function force(alpha: number) {
    const { projectPullNeutralLength, projectPullIntensity } = calibrationRef.current;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        if (a.completed !== b.completed) continue;
        const sameProject = a.project === b.project;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.01;

        let k;
        if (sameProject) {
          k = ((dist - projectPullNeutralLength) / dist) * projectPullIntensity * alpha;
        } else {
          const pushRadius = projectPullNeutralLength * CROSS_PROJECT_PUSH_RADIUS_FACTOR;
          k = Math.min(0, (dist - pushRadius) / dist) * projectPullIntensity * alpha;
        }

        const fx = dx * k;
        const fy = dy * k;
        a.vx = (a.vx ?? 0) + fx;
        a.vy = (a.vy ?? 0) + fy;
        b.vx = (b.vx ?? 0) - fx;
        b.vy = (b.vy ?? 0) - fy;
      }
    }
  }

  force.initialize = (initializedNodes: PhysicsNode[]) => {
    nodes = initializedNodes;
  };

  return force;
}

// Region around each zone centre (world px, relative to the centre) where the
// zone word and its grab pill live. Card centres are kept outside it, padded
// by half a card, so resting cards never cover the label or the handle.
const ZONE_KEEP_OUT = { halfWidth: 170 + 128, top: -64 - 30 - 55, bottom: 18 + 55 };

function forceZoneKeepOut(getTarget: (node: PhysicsNode) => { x: number; y: number }) {
  let nodes: PhysicsNode[] = [];

  function force(alpha: number) {
    for (const node of nodes) {
      if (node.fx != null) continue; // never fight the user's drag
      const t = getTarget(node);
      const dx = node.x - t.x;
      const dy = node.y - t.y;
      if (Math.abs(dx) >= ZONE_KEEP_OUT.halfWidth || dy <= ZONE_KEEP_OUT.top || dy >= ZONE_KEEP_OUT.bottom) continue;
      // Exit along whichever edge is nearest.
      const toSide = ZONE_KEEP_OUT.halfWidth - Math.abs(dx);
      const toTop = dy - ZONE_KEEP_OUT.top;
      const toBottom = ZONE_KEEP_OUT.bottom - dy;
      const k = 0.35 * alpha;
      if (toSide <= toTop && toSide <= toBottom) {
        node.vx = (node.vx ?? 0) + Math.sign(dx || 1) * toSide * k;
      } else if (toTop < toBottom) {
        node.vy = (node.vy ?? 0) - toTop * k;
      } else {
        node.vy = (node.vy ?? 0) + toBottom * k;
      }
    }
  }

  force.initialize = (initializedNodes: PhysicsNode[]) => {
    nodes = initializedNodes;
  };

  return force;
}

export function useCardPhysics(
  tasks: Task[],
  zones: Zones,
  devMode = false,
  calibration: PhysicsCalibration = DEFAULT_CALIBRATION
) {
  const motionValuesRef = useRef(new Map<string, { x: MotionValue<number>; y: MotionValue<number> }>());
  const reactionValuesRef = useRef(new Map<string, ReactionMotionValues>());
  const pairReactionsRef = useRef(new Map<string, PairReactionMotionValues>());
  const nodesRef = useRef<PhysicsNode[]>([]);
  const simRef = useRef<Simulation<PhysicsNode, undefined> | null>(null);
  const zonesRef = useRef(zones);
  const devModeRef = useRef(devMode);
  const calibrationRef = useRef(calibration);

  useEffect(() => {
    devModeRef.current = devMode;
    // If the simulation has already settled, nothing will trigger a tick to
    // compute fresh reaction values - force exactly one so lines aren't stale.
    if (devMode) simRef.current?.restart();
  }, [devMode]);

  // Live-apply calibration changes to the already-running simulation. The
  // spring forces read calibrationRef directly every tick, so just updating
  // the ref is enough for them. Collide caches its radius/strength
  // internally, so calling .radius()/.strength() re-derives them now.
  useEffect(() => {
    calibrationRef.current = calibration;
    const sim = simRef.current;
    if (!sim) return;
    const collide = sim.force("collide") as ReturnType<typeof forceCollide<PhysicsNode>> | undefined;
    collide?.radius(calibration.pushNeutralLength).strength(calibration.pushIntensity);
    sim.alpha(Math.max(sim.alpha(), 0.4)).restart();
  }, [
    calibration,
    calibration.pullNeutralLength,
    calibration.pullIntensity,
    calibration.pushNeutralLength,
    calibration.pushIntensity,
    calibration.projectPullNeutralLength,
    calibration.projectPullIntensity,
  ]);

  function getMotionValues(id: string) {
    let mv = motionValuesRef.current.get(id);
    if (!mv) {
      mv = { x: motionValue(0), y: motionValue(0) };
      motionValuesRef.current.set(id, mv);
    }
    return mv;
  }

  function getReactionMotionValues(id: string) {
    let rv = reactionValuesRef.current.get(id);
    if (!rv) {
      rv = { length: motionValue(0), colorT: motionValue(0) };
      reactionValuesRef.current.set(id, rv);
    }
    return rv;
  }

  function getPairReactionMotionValues(idA: string, idB: string) {
    const key = pairKey(idA, idB);
    let pv = pairReactionsRef.current.get(key);
    if (!pv) {
      pv = { distance: motionValue(0), colorT: motionValue(0) };
      pairReactionsRef.current.set(key, pv);
    }
    return pv;
  }

  // The Pending/Finished center a card belongs to - rule 1's target, and
  // what the dev-mode center line is drawn to.
  function rawZoneFor(node: PhysicsNode) {
    const z = zonesRef.current;
    return node.completed ? { x: z.finishedX, y: z.finishedY } : { x: z.pendingX, y: z.pendingY };
  }

  // Create the simulation once.
  useEffect(() => {
    const sim = forceSimulation<PhysicsNode>([])
      .force("pull", forcePullToTarget(rawZoneFor, calibrationRef))
      .force("project-pull", forceSameProjectPull(calibrationRef))
      .force("collide", forceCollide<PhysicsNode>(calibrationRef.current.pushNeutralLength))
      .force("zone-keep-out", forceZoneKeepOut(rawZoneFor))
      .alphaDecay(0.03)
      // A touch more friction than d3's default so cards glide and settle
      // instead of jostling.
      .velocityDecay(0.5)
      .on("tick", () => {
        const { width, height } = zonesRef.current;
        const margin = calibrationRef.current.pushNeutralLength;
        const minX = Math.min(margin, width / 2);
        const maxX = Math.max(width - margin, width / 2);
        const minY = Math.min(margin, height / 2);
        const maxY = Math.max(height - margin, height / 2);

        for (const node of nodesRef.current) {
          node.x = Math.min(maxX, Math.max(minX, node.x));
          node.y = Math.min(maxY, Math.max(minY, node.y));

          const mv = motionValuesRef.current.get(node.id);
          if (mv) {
            mv.x.set(node.x);
            mv.y.set(node.y);
          }
        }

        // Dev-mode only: recompute each card's net reaction across all three
        // rules so it can be drawn as debug lines. Skipped otherwise - the
        // pairwise passes are O(n^2).
        if (devModeRef.current && simRef.current) {
          const nodes = nodesRef.current;
          const alpha = simRef.current.alpha();
          const {
            pullIntensity,
            pullNeutralLength,
            pushNeutralLength,
            projectPullIntensity,
            projectPullNeutralLength,
          } = calibrationRef.current;
          const minDist = pushNeutralLength * 2;

          for (const node of nodes) {
            const target = rawZoneFor(node);
            const tdx = target.x - node.x;
            const tdy = target.y - node.y;
            const tdist = Math.hypot(tdx, tdy) || 0.01;
            const springFactor = ((tdist - pullNeutralLength) / tdist) * pullIntensity * alpha;
            const springMag = Math.abs(springFactor) * tdist;

            let rx = 0;
            let ry = 0;
            let projectPushMag = 0;
            let projectPullMag = 0;
            for (const other of nodes) {
              if (other === node) continue;
              const dx = node.x - other.x;
              const dy = node.y - other.y;
              const dist = Math.hypot(dx, dy) || 0.01;
              const overlap = minDist - dist;
              if (overlap > 0) {
                rx += (dx / dist) * overlap;
                ry += (dy / dist) * overlap;
              }

              let pairColorT = Math.max(0, Math.min(1, overlap / REACTION_COLOR_RANGE));
              if (node.completed === other.completed) {
                const sameProject = node.project === other.project;
                const pk = sameProject
                  ? ((dist - projectPullNeutralLength) / dist) * projectPullIntensity * alpha
                  : Math.min(0, (dist - projectPullNeutralLength * CROSS_PROJECT_PUSH_RADIUS_FACTOR) / dist) *
                    projectPullIntensity *
                    alpha;
                const pMag = Math.abs(pk) * dist;
                if (pk < 0) {
                  projectPushMag += pMag;
                  pairColorT = Math.max(-1, Math.min(1, pairColorT + pMag / REACTION_COLOR_RANGE));
                } else {
                  projectPullMag += pMag;
                  pairColorT = Math.max(-1, Math.min(1, pairColorT - pMag / REACTION_COLOR_RANGE));
                }
              }

              // Card-to-card link: gray when neutral, red when pushing apart,
              // blue when the same-project pull is drawing them together.
              const pair = getPairReactionMotionValues(node.id, other.id);
              pair.distance.set(dist);
              pair.colorT.set(pairColorT);
            }

            const collidePushMag = Math.hypot(rx, ry);
            const pushMag = collidePushMag + (springFactor < 0 ? springMag : 0) + projectPushMag;
            const pullMag = (springFactor > 0 ? springMag : 0) + projectPullMag;
            const colorT = Math.max(-1, Math.min(1, (pushMag - pullMag) / REACTION_COLOR_RANGE));

            const reaction = getReactionMotionValues(node.id);
            reaction.length.set(tdist);
            reaction.colorT.set(colorT);
          }
        }
      });
    simRef.current = sim;
    return () => {
      sim.stop();
      simRef.current = null;
    };
    // rawZoneFor only reads from zonesRef - the simulation is intentionally
    // created once, not recreated whenever the render closure changes identity.
  }, []);

  // Sync simulation nodes whenever the task list (or completion state) changes.
  useEffect(() => {
    zonesRef.current = zones;

    const sim = simRef.current;
    if (!sim) return;

    const existing = new Map(nodesRef.current.map((n) => [n.id, n]));
    const ids = new Set(tasks.map((t) => t.id));

    for (const id of Array.from(existing.keys())) {
      if (!ids.has(id)) {
        existing.delete(id);
        motionValuesRef.current.delete(id);
        reactionValuesRef.current.delete(id);
        for (const key of Array.from(pairReactionsRef.current.keys())) {
          if (key.startsWith(`${id}|`) || key.endsWith(`|${id}`)) {
            pairReactionsRef.current.delete(key);
          }
        }
      }
    }

    const nodes: PhysicsNode[] = tasks.map((task) => {
      const found = existing.get(task.id);
      if (found) {
        found.completed = task.completed;
        found.project = task.project;
        return found;
      }
      const zone = task.completed
        ? { x: zonesRef.current.finishedX, y: zonesRef.current.finishedY }
        : { x: zonesRef.current.pendingX, y: zonesRef.current.pendingY };
      const jitter = getSpawnJitter(task.id);
      const node: PhysicsNode = {
        id: task.id,
        project: task.project,
        completed: task.completed,
        x: zone.x + jitter.x,
        y: zone.y + jitter.y,
      };
      getMotionValues(task.id).x.set(node.x);
      getMotionValues(task.id).y.set(node.y);
      return node;
    });

    nodesRef.current = nodes;
    sim.nodes(nodes);
    sim.alpha(1).restart();
    // Depend on the zone primitives, not the `zones` object - Canvas passes a
    // new object every render, and we only want to resync on real changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, zones.pendingX, zones.pendingY, zones.finishedX, zones.finishedY, zones.width, zones.height]);

  function beginDrag(id: string) {
    const node = nodesRef.current.find((n) => n.id === id);
    if (!node) return;
    node.fx = node.x;
    node.fy = node.y;
    simRef.current?.alphaTarget(0.3).restart();
  }

  function dragTo(id: string, x: number, y: number) {
    const node = nodesRef.current.find((n) => n.id === id);
    if (!node) return;
    node.fx = x;
    node.fy = y;
  }

  function endDrag(id: string) {
    const node = nodesRef.current.find((n) => n.id === id);
    if (node) {
      node.fx = null;
      node.fy = null;
    }
    simRef.current?.alphaTarget(0);
  }

  return { getMotionValues, getReactionMotionValues, getPairReactionMotionValues, beginDrag, dragTo, endDrag };
}
