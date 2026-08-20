"use client";

import type { PhysicsCalibration } from "@/hooks/useCardPhysics";

interface SliderConfig {
  key: keyof PhysicsCalibration;
  label: string;
  min: number;
  max: number;
  step: number;
}

const RULES: { title: string; sliders: [SliderConfig, SliderConfig] }[] = [
  {
    title: "Rule 1 — Pull to center",
    sliders: [
      { key: "pullNeutralLength", label: "Neutral length", min: 20, max: 400, step: 5 },
      { key: "pullIntensity", label: "Force intensity", min: 0.02, max: 1, step: 0.01 },
    ],
  },
  {
    title: "Rule 2 — Card push",
    sliders: [
      { key: "pushNeutralLength", label: "Neutral length", min: 40, max: 220, step: 2 },
      { key: "pushIntensity", label: "Force intensity", min: 0.1, max: 2, step: 0.05 },
    ],
  },
  {
    title: "Rule 3 — Same project pull",
    sliders: [
      { key: "projectPullNeutralLength", label: "Neutral length", min: 40, max: 400, step: 5 },
      { key: "projectPullIntensity", label: "Force intensity", min: 0.02, max: 1, step: 0.01 },
    ],
  },
];

export function PhysicsCalibrationPanel({
  calibration,
  onChange,
}: {
  calibration: PhysicsCalibration;
  onChange: (next: PhysicsCalibration) => void;
}) {
  function setField(key: keyof PhysicsCalibration, value: number) {
    onChange({ ...calibration, [key]: value });
  }

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      className="fixed bottom-8 left-8 z-40 w-72 rounded-2xl border border-white/10 bg-zinc-900/90 p-4 text-xs text-zinc-300 shadow-2xl backdrop-blur-md"
    >
      <h3 className="mb-3 text-sm font-semibold text-zinc-100">Physics calibration</h3>

      {RULES.map((rule) => (
        <div key={rule.title} className="mb-4 last:mb-0">
          <p className="mb-2 font-medium text-zinc-200">{rule.title}</p>
          {rule.sliders.map((slider) => (
            <label key={slider.key} className="mb-2 block last:mb-0">
              <div className="mb-1 flex items-center justify-between">
                <span>{slider.label}</span>
                <span className="font-mono text-zinc-400">
                  {Math.round(calibration[slider.key] * 100) / 100}
                </span>
              </div>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={calibration[slider.key]}
                onChange={(e) => setField(slider.key, Number(e.target.value))}
                className="w-full accent-red-500"
              />
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
