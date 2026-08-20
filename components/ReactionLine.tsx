"use client";

import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

// Diverging scale: pull (attraction dominant) -> gray at rest -> push (collision dominant).
const REACTION_COLORS = ["#60a5fa", "#52525b", "#f87171"] as const;

// Always-on link from a card to its Pending/Finished center - only the
// color reacts live (pull/neutral/push); the line itself never disappears.
export function ReactionLine({
  x1,
  y1,
  x2,
  y2,
  colorT,
  length,
}: {
  x1: number;
  y1: number;
  x2: MotionValue<number>;
  y2: MotionValue<number>;
  colorT: MotionValue<number>;
  length: MotionValue<number>;
}) {
  const stroke = useTransform(colorT, [-1, 0, 1], [...REACTION_COLORS]);
  const midX = useTransform(x2, (v) => (x1 + v) / 2);
  const midY = useTransform(y2, (v) => (y1 + v) / 2);
  const labelRef = useRef<SVGTextElement>(null);

  useMotionValueEvent(length, "change", (latest) => {
    if (labelRef.current) labelRef.current.textContent = `${Math.round(latest)}px`;
  });

  return (
    <>
      <motion.line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      <motion.text
        ref={labelRef}
        x={midX}
        y={midY}
        dy={-4}
        fontSize={10}
        fontFamily="monospace"
        fill="#d4d4d8"
        textAnchor="middle"
      >
        {Math.round(length.get())}px
      </motion.text>
    </>
  );
}
