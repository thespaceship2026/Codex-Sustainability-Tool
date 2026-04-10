// Dock — floating quicklog dock at the bottom of the viewport.
//
// Each chip is a one-tap log shortcut. Clicking posts a new LogEntry
// via /api/log and briefly pulses the chip border to acknowledge the
// tap. On success the router refreshes so the observation log picks
// up the new row on its next render.

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pulsing, setPulsing] = useState<ChipKey | null>(null);
  const [failing, setFailing] = useState<ChipKey | null>(null);

  async function handleTap(key: ChipKey) {
    setPulsing(key);
    setFailing(null);
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: key })
      });
      if (!res.ok) throw new Error("log_failed");
      // Refresh the server component tree so the observation log
      // shows the new entry on its next render.
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setFailing(key);
    } finally {
      window.setTimeout(() => {
        setPulsing((current) => (current === key ? null : current));
      }, 600);
    }
  }

  return (
    <div className="dock" aria-label="Quick log">
      <span className="label">Quick log</span>
      <div className="chips">
        {CHIPS.map((chip) => {
          const isPulsing = pulsing === chip.key;
          const isFailing = failing === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              className="chip"
              style={
                isFailing
                  ? { borderColor: "var(--warn, #FCA5A5)", color: "var(--warn, #FCA5A5)" }
                  : isPulsing
                    ? { borderColor: "var(--mint-2)", color: "var(--mint-2)" }
                    : undefined
              }
              onClick={() => handleTap(chip.key)}
            >
              <span aria-hidden="true" className="ico">
                {chip.glyph}
              </span>
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
