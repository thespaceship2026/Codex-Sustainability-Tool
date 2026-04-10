// Starmap — orbital visualisation of the four missions around "You".
//
// The SVG layout is fixed (1200x640 viewBox, four mission positions around
// a central pulsing core). What's data-driven is the node style for each
// mission — LIT / ACTIVE / PARTIAL / LOCKED — pulled from MissionStateView.

import type { MissionKey, MissionStatus } from "@/lib/orbit/missions";
import { MISSIONS } from "@/lib/orbit/missions";
import type { MissionStateView, SignalView } from "@/lib/orbit/types";

type Props = {
  missions: MissionStateView[];
  signal: SignalView;
};

type Position = { x: number; y: number; r: number; orderLabel: string };

// Fixed orbital positions — chosen to match the prototype composition.
const POSITIONS: Record<MissionKey, Position> = {
  HOME_BASELINE: { x: 430, y: 290, r: 38, orderLabel: "01" },
  FLIGHT_QUESTION: { x: 830, y: 265, r: 44, orderLabel: "02" },
  FOOD_CHOICES: { x: 350, y: 420, r: 30, orderLabel: "03" },
  DIGITAL_CARBON: { x: 910, y: 440, r: 26, orderLabel: "04" }
};

function statusLabel(status: MissionStatus): string {
  return status.toUpperCase();
}

function missionNodeFill(status: MissionStatus): string {
  switch (status) {
    case "LIT":
    case "PARTIAL":
      return "url(#nodeLit)";
    case "ACTIVE":
      return "url(#nodeActive)";
    case "LOCKED":
    default:
      return "url(#nodeLocked)";
  }
}

function innerDotColor(status: MissionStatus): string {
  switch (status) {
    case "LIT":
      return "#5EEAD4";
    case "ACTIVE":
      return "#22D3EE";
    case "PARTIAL":
      return "none";
    case "LOCKED":
    default:
      return "#475569";
  }
}

export function Starmap({ missions, signal }: Props) {
  const byKey = new Map<MissionKey, MissionStateView>(
    missions.map((m) => [m.key, m])
  );

  const missionsLitCount = signal.missionsLit;
  const tCO2eLabel = signal.monthlyTCO2e.toFixed(1);

  return (
    <section id="starmap" className="section wrap">
      <div className="hdr">
        <div className="title">
          <div className="eyebrow">
            <span className="dot" />
            STARMAP <span className="sep">·</span> FOUR ACTIVE MISSIONS
          </div>
          <h2>
            The missions orbiting <span className="italic">you.</span>
          </h2>
        </div>
        <div className="hint">
          Each mission is a question
          <br />
          you&rsquo;re answering about how
          <br />
          you live on Earth.
        </div>
      </div>

      <div className="starmap-wrap">
        <div className="starmap">
          <svg viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#A7F3D0" stopOpacity="1" />
                <stop offset="35%" stopColor="#5EEAD4" stopOpacity=".75" />
                <stop offset="75%" stopColor="#2DD4BF" stopOpacity=".15" />
                <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="nodeLit" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#99F6E4" stopOpacity="1" />
                <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="nodeActive" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#7DD3FC" stopOpacity="1" />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="nodeLocked" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#475569" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#475569" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Orbital rings */}
            <g className="ring fast" opacity=".35">
              <ellipse
                cx="600"
                cy="320"
                rx="180"
                ry="70"
                fill="none"
                stroke="#5EEAD4"
                strokeWidth="0.8"
                strokeDasharray="2 6"
              />
            </g>
            <g className="ring medium" opacity=".28">
              <ellipse
                cx="600"
                cy="320"
                rx="300"
                ry="118"
                fill="none"
                stroke="#5EEAD4"
                strokeWidth="0.8"
                strokeDasharray="2 8"
              />
            </g>
            <g className="ring" opacity=".22">
              <ellipse
                cx="600"
                cy="320"
                rx="440"
                ry="172"
                fill="none"
                stroke="#5EEAD4"
                strokeWidth="0.8"
                strokeDasharray="2 10"
              />
            </g>

            {/* Connecting lines from core to each mission */}
            {Object.entries(POSITIONS).map(([key, pos]) => {
              const m = byKey.get(key as MissionKey);
              const stroke =
                m?.status === "ACTIVE"
                  ? "#22D3EE"
                  : m?.status === "LOCKED"
                  ? "#475569"
                  : "#5EEAD4";
              const opacity =
                m?.status === "LOCKED"
                  ? 0.35
                  : m?.status === "PARTIAL"
                  ? 0.35
                  : m?.status === "ACTIVE"
                  ? 0.55
                  : 0.45;
              return (
                <line
                  key={`line-${key}`}
                  x1="600"
                  y1="320"
                  x2={pos.x}
                  y2={pos.y}
                  stroke={stroke}
                  strokeWidth="0.6"
                  strokeDasharray="1 4"
                  opacity={opacity}
                />
              );
            })}

            {/* Central "You" star */}
            <g className="star-center">
              <circle cx="600" cy="320" r="56" fill="url(#coreGlow)" />
              <circle cx="600" cy="320" r="9" fill="#A7F3D0" />
              <circle cx="600" cy="320" r="5" fill="#FFFFFF" />
              <text
                x="600"
                y="398"
                textAnchor="middle"
                fontFamily="JetBrains Mono"
                fontSize="11"
                fill="#5EEAD4"
                letterSpacing="2"
              >
                YOU · {tCO2eLabel} tCO₂e/MO
              </text>
            </g>

            {/* Mission nodes */}
            {Object.entries(POSITIONS).map(([key, pos]) => {
              const m = byKey.get(key as MissionKey);
              const status: MissionStatus = m?.status ?? "LOCKED";
              const def = MISSIONS[key as MissionKey];
              const title = `${def.title.toUpperCase()} · ${statusLabel(status)}`;
              const labelFill = status === "LOCKED" ? "#64748B" : "#94A3B8";
              const valueFill = status === "LOCKED" ? "#64748B" : "#F8FAFC";

              return (
                <g className="mission-node" key={`node-${key}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={pos.r}
                    fill={missionNodeFill(status)}
                    opacity={status === "PARTIAL" ? 0.35 : status === "ACTIVE" ? 0.7 : 0.6}
                  />
                  {status === "PARTIAL" ? (
                    <>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="8"
                        fill="none"
                        stroke="#5EEAD4"
                        strokeWidth="2"
                      />
                      <path
                        d={`M${pos.x} ${pos.y - 8} A8 8 0 0 1 ${pos.x} ${pos.y + 8} Z`}
                        fill="#5EEAD4"
                      />
                    </>
                  ) : (
                    <circle cx={pos.x} cy={pos.y} r="9" fill={innerDotColor(status)} />
                  )}
                  {status === "ACTIVE" && (
                    <circle cx={pos.x} cy={pos.y} r="15" fill="none" stroke="#22D3EE" strokeWidth="1">
                      <animate
                        attributeName="r"
                        from="15"
                        to="26"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from=".8"
                        to="0"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  {status === "LIT" && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="14"
                      fill="none"
                      stroke="#5EEAD4"
                      strokeWidth="1"
                    />
                  )}
                  <text
                    className="mission-label"
                    x={pos.x}
                    y={pos.y + 50}
                    textAnchor="middle"
                    fill={labelFill}
                  >
                    {title}
                  </text>
                  <text
                    className="mission-value"
                    x={pos.x}
                    y={pos.y - 38}
                    textAnchor="middle"
                    fill={valueFill}
                  >
                    {pos.orderLabel}
                  </text>
                </g>
              );
            })}

            {/* Background sparkle stars */}
            <circle cx="200" cy="150" r="1.4" fill="#ffffff" opacity=".8" />
            <circle cx="1050" cy="180" r="1.2" fill="#ffffff" opacity=".6" />
            <circle cx="140" cy="520" r="1.6" fill="#ffffff" opacity=".7" />
            <circle cx="1080" cy="560" r="1.4" fill="#ffffff" opacity=".75" />
            <circle cx="560" cy="90" r="1.2" fill="#ffffff" opacity=".5" />
            <circle cx="720" cy="570" r="1.8" fill="#99F6E4" opacity=".8" />
            <circle cx="260" cy="380" r="1.2" fill="#ffffff" opacity=".55" />
          </svg>

          <div className="readout">
            <div className="head">Telemetry</div>
            <div className="row">
              <span className="k">ORBIT</span>
              <span className="v">
                {signal.trajectory === "CLIMBING" ? "DRIFTING" : "STABLE"}
              </span>
            </div>
            <div className="row">
              <span className="k">MISSIONS</span>
              <span className="v">{missionsLitCount} / 4 LIT</span>
            </div>
            <div className="row">
              <span className="k">MONTHLY</span>
              <span className="v">{tCO2eLabel} tCO₂e</span>
            </div>
            <div className="row">
              <span className="k">TRAJECTORY</span>
              <span className="v">{signal.trajectory}</span>
            </div>
          </div>

          <div className="legend">
            <span className="swatch">
              <span className="dot lit" /> LIT
            </span>
            <span className="swatch">
              <span className="dot active" /> ACTIVE
            </span>
            <span className="swatch">
              <span className="dot partial" /> PARTIAL
            </span>
            <span className="swatch">
              <span className="dot locked" /> LOCKED
            </span>
          </div>
        </div>
      </div>

      <MissionCards missions={missions} />
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Mission cards — the four summary cards beneath the starmap
// ────────────────────────────────────────────────────────────────────────────

function MissionCards({ missions }: { missions: MissionStateView[] }) {
  return (
    <div className="missions-grid">
      {missions.map((m) => {
        const def = MISSIONS[m.key];
        const stateClass = m.status.toLowerCase();
        const label =
          m.status === "LIT"
            ? `Mission ${def.order.toString().padStart(2, "0")} · Lit`
            : m.status === "ACTIVE"
            ? `Mission ${def.order.toString().padStart(2, "0")} · In flight`
            : m.status === "PARTIAL"
            ? `Mission ${def.order.toString().padStart(2, "0")} · Partial`
            : `Mission ${def.order.toString().padStart(2, "0")} · Locked`;

        const fillWidth =
          m.status === "LIT" ? 100 : m.status === "LOCKED" ? 0 : m.progress;

        const footLeft =
          m.status === "LIT"
            ? "Completed"
            : m.status === "ACTIVE"
            ? `${Math.round((m.progress / 100) * def.questions.length)} / ${def.questions.length} answered`
            : m.status === "PARTIAL"
            ? "Draft"
            : def.unlocksAfter && def.unlocksAfter.length > 0
            ? `Unlocks at M${(def.order - 1).toString().padStart(2, "0")}`
            : "Locked";

        const footRight =
          m.status === "LIT"
            ? "✓"
            : m.status === "LOCKED"
            ? "—"
            : m.status === "PARTIAL"
            ? `${m.progress}%`
            : `~${def.estimatedMinutes} min`;

        return (
          <a
            key={m.key}
            className={`mcard ${stateClass}`}
            href={`#${m.key.toLowerCase()}`}
          >
            <div className="state">
              <span className="dot" />
              {label}
            </div>
            <h3>{def.title}</h3>
            <p>{def.description}</p>
            <div className="progress">
              <span className="fill" style={{ width: `${fillWidth}%` }} />
            </div>
            <div className="foot">
              <span>{footLeft}</span>
              <span className="val">{footRight}</span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
