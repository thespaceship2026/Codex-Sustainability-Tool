"use client";

// Orbit v2 — RevealScreen
//
// The payoff moment. After five quiz questions, this screen animates the
// signal score from 0 to the computed value, shows a single sharp insight,
// then presents the email capture and Thrive Lab bridge.
//
// This is where the lead magnet converts: the user just learned something
// surprising about their own footprint, and the capture appears while
// that curiosity is fresh.

import { useState, useEffect, useRef } from "react";
import type { QuizResult } from "./QuizFlow";

type Props = {
  result: QuizResult;
  onExplore: () => void; // "Show me the full dashboard"
};

export function RevealScreen({ result, onExplore }: Props) {
  const { score, monthlyTCO2e, breakdown, insight } = result;
  const [displayScore, setDisplayScore] = useState(0);
  const [phase, setPhase] = useState<"counting" | "insight" | "capture">("counting");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [captureStatus, setCaptureStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [captureError, setCaptureError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate score counter — uses setInterval + Date.now so the animation
  // completes even if the tab isn't in the foreground (RAF pauses in
  // background tabs, which can leave the counter at zero).
  useEffect(() => {
    const duration = 1800; // ms
    const start = Date.now();

    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));

      if (progress >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        // Score counted up — show insight after a beat
        setTimeout(() => setPhase("insight"), 400);
        setTimeout(() => setPhase("capture"), 1600);
      }
    }

    timerRef.current = setInterval(tick, 16);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [score]);

  // Determine the dominant category for the breakdown visual
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
      {/* ── Signal score ─────────────────────────────────────────── */}
      <div className="reveal-score-section">
        <div className="reveal-eyebrow">
          <span className="dot" /> YOUR ORBIT
        </div>

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
          {monthlyTCO2e.toFixed(1)} tonnes CO₂ per month
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
              actually lives, and updates weekly. We&apos;ll send your first
              full report on Sunday.
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
                  {captureStatus === "submitting" ? "Sending…" : "Send my report"}
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
