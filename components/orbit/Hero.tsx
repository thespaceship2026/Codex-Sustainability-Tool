// Hero — editorial headline + "Signal" readout card.
// Server component. Numbers come from the snapshot.

import type { SignalView } from "@/lib/orbit/types";

type Props = {
  signal: SignalView;
  weekLabel: string; // "WEEK 14"
  previousScore?: number; // for the delta line; optional
};

function trajectoryLabel(t: SignalView["trajectory"]): string {
  switch (t) {
    case "STEADY":
      return "STEADY";
    case "DRIFTING":
      return "DRIFTING";
    case "CLIMBING":
      return "CLIMBING";
    case "SETTLING":
      return "SETTLING";
    default:
      return "STEADY";
  }
}

export function Hero({ signal, weekLabel, previousScore }: Props) {
  const delta = previousScore != null ? signal.score - previousScore : null;

  return (
    <section className="hero wrap">
      <div className="grid">
        <div>
          <div className="meta reveal r1">
            <span className="eyebrow">
              <span className="dot" />
              FROM ORBIT
            </span>
            <span className="eyebrow">
              <span className="sep">·</span>OBSERVATION LOG
            </span>
            <span className="eyebrow">
              <span className="sep">·</span>
              {weekLabel}
            </span>
          </div>

          <h1 className="reveal r2">
            Your orbit,
            <br />
            this <span className="italic">week.</span>
          </h1>

          <p className="lede reveal r3">
            Every week we take a quiet pass over your habits — fuel, flights,
            food, bits, and the small decisions that add up. Nothing to score.
            Nothing to shame. Just a steady look at the path you&rsquo;re actually on.
          </p>

          <div className="cta-row reveal r4">
            <a className="btn btn-mint" href="#starmap">
              Enter the starmap
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12l7 7 7-7"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a className="btn btn-ghost" href="#log">
              Read this week&rsquo;s log
            </a>
          </div>
        </div>

        <div className="signal reveal r3">
          <div className="top">
            <span>Signal</span>
            <span className="pill">{trajectoryLabel(signal.trajectory)}</span>
          </div>

          <div className="big">
            <span className="num">{signal.score}</span>
            <span className="denom">/ 100</span>
          </div>

          <div className="label">Trajectory to your 2026 commitment</div>

          <div className="bar">
            <div
              className="fill"
              style={{ width: `${Math.max(4, Math.min(100, signal.score))}%` }}
            />
          </div>

          <div className="foot">
            {previousScore != null ? (
              <span>LAST WEEK · {previousScore}</span>
            ) : (
              <span>FIRST READING</span>
            )}
            {delta != null && delta !== 0 ? (
              <span className="delta">
                {delta > 0 ? "▲" : "▼"} {delta > 0 ? "+" : ""}
                {delta}
              </span>
            ) : (
              <span className="delta">STEADY</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
