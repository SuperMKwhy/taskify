"use client";

import { useEffect, useRef } from "react";
import {
  forceSimulation,
  forceX,
  forceY,
  forceCollide,
  type Simulation,
} from "d3-force";
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
  completed: boolean;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export const CARD_COLLIDE_RADIUS = 108;
const ZONE_STRENGTH = 0.06;

export function useCardPhysics(tasks: Task[], zones: Zones) {
  const motionValuesRef = useRef(new Map<string, { x: MotionValue<number>; y: MotionValue<number> }>());
  const nodesRef = useRef<PhysicsNode[]>([]);
  const simRef = useRef<Simulation<PhysicsNode, undefined> | null>(null);
  const zonesRef = useRef(zones);

  function getMotionValues(id: string) {
    let mv = motionValuesRef.current.get(id);
    if (!mv) {
      mv = { x: motionValue(0), y: motionValue(0) };
      motionValuesRef.current.set(id, mv);
    }
    return mv;
  }

  function zoneFor(node: PhysicsNode) {
    const z = zonesRef.current;
    return node.completed ? { x: z.finishedX, y: z.finishedY } : { x: z.pendingX, y: z.pendingY };
  }

  // Create the simulation once.
  useEffect(() => {
    const sim = forceSimulation<PhysicsNode>([])
      .force("x", forceX<PhysicsNode>((d) => zoneFor(d).x).strength(ZONE_STRENGTH))
      .force("y", forceY<PhysicsNode>((d) => zoneFor(d).y).strength(ZONE_STRENGTH))
      .force("collide", forceCollide<PhysicsNode>(CARD_COLLIDE_RADIUS))
      .alphaDecay(0.03)
      .on("tick", () => {
        const { width, height } = zonesRef.current;
        const margin = CARD_COLLIDE_RADIUS;
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
      });
    simRef.current = sim;
    return () => {
      sim.stop();
      simRef.current = null;
    };
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
      }
    }

    const nodes: PhysicsNode[] = tasks.map((task) => {
      const found = existing.get(task.id);
      if (found) {
        found.completed = task.completed;
        return found;
      }
      const zone = task.completed
        ? { x: zonesRef.current.finishedX, y: zonesRef.current.finishedY }
        : { x: zonesRef.current.pendingX, y: zonesRef.current.pendingY };
      const jitter = getSpawnJitter(task.id);
      const node: PhysicsNode = {
        id: task.id,
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

  return { getMotionValues, beginDrag, dragTo, endDrag };
}
