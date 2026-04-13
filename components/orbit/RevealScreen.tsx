"use client";

// Orbit v2 — RevealScreen (redesigned)
//
// The payoff moment. After five quiz questions (each with a learning
// fact), this screen:
//
//   1. Animates the signal score (0 → computed value)
//   2. Shows a single sharp insight
//   3. Presents an interactive "swap lever" — pick one change, see
//      how much it moves your score (agency, not guilt)
//   4. Features a closing Carbon Almanac quote
//   5. Email capture + Thrive Lab bridge
//
// The redesign shifts the emotional register from "here's your grade"
// to "here's what you just learned — and the ONE thing that could
// change the picture most."

import { useState, useEffect, useRef, useMemo } from "react";
import { REVEAL_QUOTES } from "@/lib/orbit/almanac-facts";
import type { QuizResult } from "./QuizFlow";

type Props = {
  result: QuizResult;
  onExplore: () => void;
};

// ────────────────────────────────────────────────────────────────────────────
// Swap lever options — "What if you changed ONE thing?"
// Each swap shows a hypothetical CO₂ reduction and reframes the score.
// ────────────────────────────────────────────────────────────────────────────

type SwapOption = {
  id: string;
  label: string;
  description: string;
  /** Approximate monthly tCO₂e saved */
  savingsKg: number;
  relevantTo: string[]; // answer values that make this swap relevant
  icon: string;
};

const SWAP_OPTIONS: SwapOption[] = [
  {
    id: "flight",
    label: "Skip one flight",
    description: "One fewer round-trip this year saves the equivalent of months of driving.",
    savingsKg: 230,
    relevantTo: ["one_short", "one_long", "two_plus", "frequent"],
    icon: "\u2708\uFE0F",
  },
  {
    id: "meat",
    label: "Two plant days a week",
    description: "Swap beef for plants just two days. That\u2019s 30 fewer pounds of CO\u2082 each time.",
    savingsKg: 45,
    relevantTo: ["heavy_meat", "meat", "flexitarian"],
    icon: "\uD83C\uDF31",
  },
  {
    id: "transport",
    label: "Commute without driving",
    description: "Bike, bus, or walk one day a week. A small shift in how you move changes the math.",
    savingsKg: 60,
    relevantTo: ["petrol", "shared"],
    icon: "\uD83D\uDEB2",
  },
  {
    id: "heat",
    label: "Switch to a heat pump",
    description: "Heat pumps use a fraction of the energy that gas or oil furnaces do.",
    savingsKg: 80,
    relevantTo: ["gas", "oil"],
    icon: "\uD83C\uDFE0",
  },
  {
    id: "digital",
    label: "Unplug what you\u2019re not using",
    description: "Standby power adds up. Gaming consoles alone can use 150\u2013216 Wh per hour of play.",
    savingsKg: 15,
    relevantTo: ["US", "UK", "FR", "DE", "OTHER"],
    icon: "\uD83D\uDD0C",
  },
];

export function RevealScreen({ result, onExplore }: Props) {
  const { score, monthlyTCO2e, breakdown, insight, answers } = result;
  const [displayScore, setDisplayScore] = useState(0);
  const [phase, setPhase] = useState<"counting" | "insight" | "swap" | "capture">("counting");
  const [selectedSwap, setSelectedSwap] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [captureStatus, setCaptureStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [captureError, setCaptureError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pick a quote deterministically from the score
  const quote = REVEAL_QUOTES[score % REVEAL_QUOTES.length];

  // Find relevant swaps based on user&apos;s answers
  const relevantSwaps = useMemo(() => {
    const answerValues = Object.values(answers ?? {});
    return SWAP_OPTIONS.filter(sw =>
      sw.relevantTo.some(v => answerValues.includes(v))
    ).slice(0, 3); // max 3 options
  }, [answers]);

  // Compute hypothetical savings
  const swapSavingsMonthly = useMemo(() => {
    if (!selectedSwap) return 0;
    const sw = SWAP_OPTIONS.find(s => s.id === selectedSwap);
    return sw ? sw.savingsKg / 1000 : 0; // convert kg to tonnes
  }, [selectedSwap]);

  const adjustedMonthly = Math.max(0, monthlyTCO2e - swapSavingsMonthly);

  // Animate score counter
  useEffect(() => {
    const duration = 1800;
    const start = Date.now();

    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));

      if (progress >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => setPhase("insight"), 400);
        setTimeout(() => setPhase("swap"), 1800);
        setTimeout(() => setPhase("capture"), 3200);
      }
    }

    timerRef.current = setInterval(tick, 16);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [score]);

  // Determine dominant category for breakdown
  const total = breakdown.home + breakdown.flights + breakdown.food + breakdown.digital;
  const bars = [
    { key: "home", label: "Home", value: breakdown.home, color: "var(--mint)" },
    { key: "flights", label: "Flights", value: breakdown.flights, color: "var(--cyan)" },
    { key: "food", label: "Food", value: breakdown.food, color: "var(--sky)" },
    { key: "digital", label: "Digital", value: breakdown.digital, color: "var(--ink-4)" },
  ].filter(b => b.value > 0);

  const trajectory = score >= 70 ? "LIGHT" : score >= 40 ? "STEADY" : "HEAVY";

  async function handleCapture(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (captureStatus === "submitting" || captureStatus === "success") return;

    const trimmed = email.trim();
    if (!trimmed) {
      setCaptureError("We need an email to send the digest to.");
      setCaptureStatus("error");
      return;
    }
    if (!consent) {
      setCaptureError("Tick the box so we know you want it.");
      setCaptureStatus("error");
      return;
    }

    setCaptureStatus("submitting");
    setCaptureError(null);

    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source: "orbit_quiz_reveal",
          signalAtCapture: score,
          monthlyTCO2e,
          consent,
          selectedSwap,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Something went wrong. Try again?");
      }

      setCaptureStatus("success");
    } catch (err) {
      setCaptureStatus("error");
      setCaptureError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="reveal">
      {/* ── Discovery header ────────────────────────────────────────── */}
      <div className="reveal-discovery-header">
        <div className="reveal-eyebrow">
          <span className="dot" /> YOUR ORBIT
        </div>
        <p className="reveal-discovery-intro">
          Based on five answers, here&apos;s a first look at where your
          carbon footprint actually lives.
        </p>
      </div>

      {/* ── Signal score ─────────────────────────────────────────── */}
      <div className="reveal-score-section">
        <div className="reveal-gauge">
          <svg viewBox="0 0 200 200" className="reveal-gauge-svg">
            <circle cx="100" cy="100" r="82" fill="none" stroke="var(--line-1)" strokeWidth="6" />
            <circle
              cx="100" cy="100" r="82"
              fill="none"
              stroke="var(--mint)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 82}
              strokeDashoffset={2 * Math.PI * 82 * (1 - displayScore / 100)}
              transform="rotate(-90 100 100)"
              className="reveal-gauge-fill"
            />
          </svg>
          <div className="reveal-gauge-text">
            <span className="reveal-score-num">{displayScore}</span>
            <span className="reveal-score-denom">/ 100</span>
          </div>
        </div>

        <div className="reveal-trajectory">
          <span className={`reveal-pill ${trajectory.toLowerCase()}`}>{trajectory}</span>
        </div>

        <div className="reveal-tco2e">
          {monthlyTCO2e.toFixed(1)} tonnes CO&#8322; per month
        </div>

        {/* Breakdown bars */}
        {total > 0 && (
          <div className="reveal-breakdown">
            {bars.map((b) => (
              <div key={b.key} className="reveal-bar-row">
                <span className="reveal-bar-label">{b.label}</span>
                <div className="reveal-bar-track">
                  <div
                    className="reveal-bar-fill"
                    style={{
                      width: `${(b.value / total) * 100}%`,
                      backgroundColor: b.color,
                    }}
                  />
                </div>
                <span className="reveal-bar-pct">{Math.round((b.value / total) * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Insight ──────────────────────────────────────────────── */}
      <div className={`reveal-insight ${phase !== "counting" ? "visible" : ""}`}>
        <p>{insight}</p>
      </div>

      {/* ── Swap lever — "What if you changed ONE thing?" ─────── */}
      <div className={`reveal-swap ${phase === "swap" || phase === "capture" ? "visible" : ""}`}>
        <h3 className="reveal-swap-headline">What if you changed one thing?</h3>
        <p className="reveal-swap-subtext">
          Pick a swap. See how much it moves the needle.
        </p>

        <div className="reveal-swap-options">
          {relevantSwaps.map((sw) => (
            <button
              key={sw.id}
              className={`reveal-swap-btn ${selectedSwap === sw.id ? "active" : ""}`}
              onClick={() => setSelectedSwap(selectedSwap === sw.id ? null : sw.id)}
            >
              <span className="reveal-swap-icon">{sw.icon}</span>
              <span className="reveal-swap-label">{sw.label}</span>
            </button>
          ))}
        </div>

        {selectedSwap && (
          <div className="reveal-swap-result">
            <p className="reveal-swap-description">
              {SWAP_OPTIONS.find(s => s.id === selectedSwap)?.description}
            </p>
            <div className="reveal-swap-savings">
              <span className="reveal-swap-from">{monthlyTCO2e.toFixed(2)}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="reveal-swap-arrow">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="var(--mint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="reveal-swap-to">{adjustedMonthly.toFixed(2)}</span>
              <span className="reveal-swap-unit">tonnes/mo</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Carbon Almanac quote ─────────────────────────────────── */}
      <div className={`reveal-almanac-quote ${phase === "capture" ? "visible" : ""}`}>
        <blockquote>
          <p>&ldquo;{quote.text}&rdquo;</p>
          <cite>&mdash; {quote.attribution}</cite>
        </blockquote>
        <div className="reveal-almanac-credit">
          From <strong>The Carbon Almanac</strong> &middot; Partner of The Spaceship Academy
        </div>
      </div>

      {/* ── Email capture ────────────────────────────────────────── */}
      <div className={`reveal-capture ${phase === "capture" ? "visible" : ""}`}>
        {captureStatus === "success" ? (
          <div className="reveal-capture-done">
            <h3>You&apos;re on the list.</h3>
            <p>
              Your first Orbit digest lands on Sunday. Your signal, one
              thing worth trying, and a short read we think is worth
              your time.
            </p>
            <button className="btn btn-mint" onClick={onExplore}>
              See the full picture
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <h3>Want to see the full picture?</h3>
            <p>
              This is a first pass from five questions. The complete Orbit
              dashboard tracks four missions, shows where your footprint
              actually lives, and updates weekly.
            </p>
            <form className="reveal-form" onSubmit={handleCapture} noValidate>
              <div className="reveal-form-row">
                <label className="sr-only" htmlFor="reveal-email">
                  Email address
                </label>
                <input
                  id="reveal-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@somewhere.earth"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (captureStatus === "error") {
                      setCaptureStatus("idle");
                      setCaptureError(null);
                    }
                  }}
                  disabled={captureStatus === "submitting"}
                  required
                />
                <button type="submit" className="btn btn-mint" disabled={captureStatus === "submitting"}>
                  {captureStatus === "submitting" ? "Sending\u2026" : "Send my report"}
                </button>
              </div>
              <label className="reveal-consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  disabled={captureStatus === "submitting"}
                />
                <span>Yes, send me the weekly Orbit digest. I can leave any Sunday.</span>
              </label>
              {captureStatus === "error" && captureError ? (
                <p className="capture-error" role="alert">{captureError}</p>
              ) : null}
            </form>

            <button className="reveal-skip" onClick={onExplore}>
              Skip for now and explore the dashboard
            </button>
          </>
        )}
      </div>

      {/* ── Thrive Lab bridge ────────────────────────────────────── */}
      <div className={`reveal-bridge ${phase === "capture" ? "visible" : ""}`}>
        <div className="reveal-bridge-kicker">
          FROM UNDERSTANDING TO ACTION
        </div>
        <h3>
          Ready to go deeper? <span className="italic">Thrive Lab</span> is where this gets real.
        </h3>
        <p>
          One week at The Hun School of Princeton. Systems thinking,
          planetary boundaries, and the kind of learning that changes how
          you see every decision you&apos;ll make this year. Grades 9 to 12.
          Summer 2026.
        </p>
        <a
          className="btn btn-mint"
          href="https://www.hunschool.org/summer/summer-leadership-institute"
          target="_blank"
          rel="noreferrer"
        >
          Explore the programme
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </div>
  );
}
