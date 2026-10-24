"use client";

import { motion, useReducedMotion } from "motion/react";
import { GridBackdrop } from "./GridBackdrop";
import { Wordmark } from "./ui";
import { getProjectHue } from "@/lib/hash";

// Illustrative cards drifting behind the form - they show what the board
// feels like before the visitor has one.
const SAMPLE_CARDS = [
  { title: "Book dentist appointment", project: "Home", due: "Tomorrow", x: "8%", y: "18%", r: -4 },
  { title: "Draft Q3 roadmap", project: "Work", due: "Today", x: "74%", y: "14%", r: 3 },
  { title: "Water the plants", project: "Home", due: "Done", x: "78%", y: "68%", r: -2, done: true },
  { title: "Chapter 4 notes", project: "Thesis", due: "Fri", x: "6%", y: "66%", r: 2 },
];

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <GridBackdrop className="overflow-y-auto">
      <div
        aria-hidden
        className="pointer-events-none absolute left-[18%] top-[30%] h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.72 0.17 45 / 0.4), oklch(0.66 0.2 10 / 0.16) 50%, transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[82%] top-[72%] h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.76 0.13 175 / 0.34), oklch(0.68 0.14 220 / 0.16) 50%, transparent)",
        }}
      />

      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        {SAMPLE_CARDS.map((card, i) => {
          const hue = getProjectHue(card.project);
          return (
            <motion.div
              key={card.title}
              className="absolute w-60"
              style={{ left: card.x, top: card.y, rotate: card.r }}
              animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.7 }}
            >
              <div className={`glass rounded-[20px] p-4 ${card.done ? "opacity-60" : ""}`}>
                <div className="mb-2.5 flex items-center justify-between">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ color: `oklch(0.9 0.07 ${hue})`, background: `oklch(0.7 0.12 ${hue} / 0.16)` }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: `oklch(0.8 0.15 ${hue})` }} />
                    {card.project}
                  </span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-fg-muted">{card.due}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-5 w-5 rounded-full border ${card.done ? "border-success bg-success" : "border-white/35"}`}
                  />
                  <span className={`text-[15px] font-semibold ${card.done ? "text-fg-muted line-through" : "text-fg"}`}>
                    {card.title}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
        <Wordmark className="mb-8" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong w-full max-w-[400px] rounded-[28px] p-6 sm:p-8"
        >
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-fg">{title}</h1>
          <p className="mt-1.5 text-[15px] text-fg-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </motion.div>
      </div>
    </GridBackdrop>
  );
}
