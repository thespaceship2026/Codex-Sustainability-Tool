// Dock — floating quicklog dock at the bottom of the viewport.
// Each chip is a one-tap log shortcut. The interaction is ephemeral:
// clicking a chip briefly pulses its border to acknowledge the tap.
// Real persistence gets wired up in Phase 2 when the POST /api/log
// endpoint lands; for now this is purely a visual affordance so the
// rest of the page feels alive.

"use client";

import { useState } from "react";

type ChipKey = "flight" | "meal" | "energy" | "trip";

type ChipDef = {
  key: ChipKey;
  label: string;
  glyph: string;
};

const CHIPS: ChipDef[] = [
  { key: "flight", label: "Flight", glyph: "✈" },
  { key: "meal", label: "Meal", glyph: "🍽" },
  { key: "energy", label: "Energy", glyph: "⚡" },
  { key: "trip", label: "Trip", glyph: "↗" }
];

export function Dock() {
  const [pulsing, setPulsing] = useState<ChipKey | null>(null);

  function handlePulse(key: ChipKey) {
    setPulsing(key);
    window.setTimeout(() => {
      setPulsing((current) => (current === key ? null : current));
    }, 600);
  }

  return (
    <div className="dock" aria-label="Quick log">
      <span className="label">Quick log</span>
      <div className="chips">
        {CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className="chip"
            style={
              pulsing === chip.key
                ? { borderColor: "var(--mint-2)", color: "var(--mint-2)" }
                : undefined
            }
            onClick={() => handlePulse(chip.key)}
          >
            <span aria-hidden="true" className="ico">
              {chip.glyph}
            </span>
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
