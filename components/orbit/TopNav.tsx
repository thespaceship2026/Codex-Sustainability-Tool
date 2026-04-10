"use client";

// Top navigation — sticky header with brand, mode switcher, week stamp,
// and primary CTA. Client component because the mode switcher holds
// local state. Mode switching is visual-only in v2 (SOLO is the only
// real mode) but the tabs are wired so household / classroom can plug in.

import { useState } from "react";
import type { OrbitSnapshot } from "@/lib/orbit/types";

type Props = {
  snapshot: OrbitSnapshot;
  weekLabel: string; // e.g. "W14 · 2026"
  dateLabel: string; // e.g. "04/10"
};

const MODES = [
  { value: "SOLO", label: "Solo" },
  { value: "HOUSEHOLD", label: "Household" },
  { value: "CLASSROOM", label: "Classroom" }
] as const;

export function TopNav({ snapshot, weekLabel, dateLabel }: Props) {
  const [mode, setMode] = useState<string>(snapshot.traveller.mode);

  return (
    <header className="topnav">
      <div className="wrap row">
        <a className="brand" href="#">
          <span className="mark">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="2.4" fill="#5EEAD4" />
              <ellipse cx="12" cy="12" rx="9" ry="3.2" stroke="#5EEAD4" strokeWidth="1.3" />
              <ellipse
                cx="12"
                cy="12"
                rx="9"
                ry="3.2"
                stroke="#5EEAD4"
                strokeWidth="1.3"
                transform="rotate(60 12 12)"
              />
              <ellipse
                cx="12"
                cy="12"
                rx="9"
                ry="3.2"
                stroke="#5EEAD4"
                strokeWidth="1.3"
                transform="rotate(-60 12 12)"
              />
            </svg>
          </span>
          Orbit
          <span className="sub">The Spaceship Academy</span>
        </a>

        <div className="mode-switch" role="tablist" aria-label="Mode">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              className={mode === m.value ? "on" : ""}
              onClick={() => setMode(m.value)}
              role="tab"
              aria-selected={mode === m.value}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="stamp mono">
          <span style={{ color: "var(--ink-5)" }}>{weekLabel}</span>
          <span style={{ color: "var(--ink-5)", margin: "0 4px" }}>·</span>
          <span style={{ color: "var(--ink-3)" }}>{dateLabel}</span>
        </div>

        <a href="#bridge" className="btn btn-mint">
          Launch your journey
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M13 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </header>
  );
}
