"use client";

import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

// Gray when neutral, red when the pair is pushing apart (rule 2), blue when
// the same-project pull (rule 3) is drawing them together.
const LINK_COLORS = ["#60a5fa", "#a1a1aa", "#ef4444"] as const;

// Always-on link between two cards - only color/opacity react live to
// whether they're currently pushing into each other.
export function CardLinkLine({
  x1,
  y1,
  x2,
  y2,
  colorT,
  distance,
}: {
  x1: MotionValue<number>;
  y1: MotionValue<number>;
  x2: MotionValue<number>;
  y2: MotionValue<number>;
  colorT: MotionValue<number>;
  distance: MotionValue<number>;
}) {
  const stroke = useTransform(colorT, [-1, 0, 1], [...LINK_COLORS]);
  const opacity = useTransform(colorT, [-1, 0, 1], [1, 0.55, 1]);
  const midX = useTransform([x1, x2], ([a, b]: number[]) => (a + b) / 2);
  const midY = useTransform([y1, y2], ([a, b]: number[]) => (a + b) / 2);
  const labelRef = useRef<SVGTextElement>(null);

  useMotionValueEvent(distance, "change", (latest) => {
    if (labelRef.current) labelRef.current.textContent = `${Math.round(latest)}px`;
  });

  return (
    <>
      <motion.line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeOpacity={opacity} strokeWidth={2} />
      <motion.text
        ref={labelRef}
        x={midX}
        y={midY}
        dy={-3}
        fontSize={9}
        fontFamily="monospace"
        fill="#a1a1aa"
        textAnchor="middle"
        opacity={opacity}
      >
        {Math.round(distance.get())}px
      </motion.text>
    </>
  );
}
