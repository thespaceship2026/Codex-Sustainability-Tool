// Descent — quantitative ladder comparing You / Household / Campus / City /
// Fair share. The numbers plug in from the SignalView; the other reference
// rows use fixed anchors (households average ~1.2× solo; campus 1.45×;
// city 2.05×; fair share = signal.fairShareMonthly).

import type { SignalView } from "@/lib/orbit/types";

type Props = {
  signal: SignalView;
};

// Scale top — we normalise all bars against 8 tCO2e/mo so the scale
// stays consistent with the 0..8 axis in the hint row.
const SCALE_TOP = 8;

function pct(value: number): number {
  return Math.max(0, Math.min(100, (value / SCALE_TOP) * 100));
}

export function Descent({ signal }: Props) {
  const you = signal.monthlyTCO2e;
  const household = you * 1.2;
  const campus = you * 1.45;
  const city = you * 2.05;
  const fair = signal.fairShareMonthly;

  const fairPct = pct(fair);

  return (
    <section className="section wrap descent">
      <div className="hdr">
        <div className="title">
          <div className="eyebrow">
            <span className="dot" />
            THE DESCENT <span className="sep">·</span> MONTHLY FOOTPRINT
          </div>
          <h2>
            How far is the ground from <span className="italic">here?</span>
          </h2>
        </div>
        <div className="hint">
          Each rung is a tonne of CO₂
          <br />
          equivalent per month. The dashed
          <br />
          line is a fair share of a livable planet.
        </div>
      </div>

      <div className="board">
        <div className="scale">
          <span>0</span>
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
          <span>6</span>
          <span>7</span>
          <span>8 tCO₂e</span>
        </div>

        <div className="ladder">
          <Rung name="You" tag="Solo" value={you} variant="you" />
          <Rung name="Your household" value={household} variant="house" />
          <Rung name="Your campus avg" value={campus} variant="camp" />
          <Rung name="Your city avg" value={city} variant="city" />
          <FairRung value={fair} fairPct={fairPct} />
        </div>

        <p className="note">
          {you > fair * 3 ? (
            <>
              You&rsquo;re carrying a heavier orbit than the fair share allows. The
              distance that matters is between <strong>where you are</strong> and{" "}
              <strong>where we all need to be</strong> — and that distance shrinks
              the fastest through a few big moves, not a thousand small ones.
            </>
          ) : you > fair ? (
            <>
              You&rsquo;re already below your household and campus averages — a good
              starting altitude. The distance that matters is between{" "}
              <strong>where you are</strong> and{" "}
              <strong>where we all need to be</strong>. That distance shrinks the
              fastest through a few big moves, not a thousand small ones.
            </>
          ) : (
            <>
              You&rsquo;re already inside the fair-share envelope. The work now is
              holding the line — keeping the big levers (flights, heating, meat)
              pointed the right way and letting the small decisions look after
              themselves.
            </>
          )}
        </p>
      </div>
    </section>
  );
}

function Rung({
  name,
  tag,
  value,
  variant
}: {
  name: string;
  tag?: string;
  value: number;
  variant: "you" | "house" | "camp" | "city";
}) {
  return (
    <div className={`rung ${variant}`}>
      <div className="name">
        {name}
        {tag && <span className="tag">{tag}</span>}
      </div>
      <div className="track">
        <div className="bar" style={{ width: `${pct(value)}%` }} />
      </div>
      <div className="val">{value.toFixed(1)} tCO₂e / mo</div>
    </div>
  );
}

function FairRung({ value, fairPct }: { value: number; fairPct: number }) {
  return (
    <div className="rung fair">
      <div className="name">Fair share</div>
      <div className="track">
        <div className="bar" style={{ width: `${fairPct}%` }} />
        <span className="flag" style={{ left: `${fairPct}%` }}>
          Fair share · {value.toFixed(1)} t
        </span>
      </div>
      <div className="val">{value.toFixed(1)} tCO₂e / mo</div>
    </div>
  );
}
