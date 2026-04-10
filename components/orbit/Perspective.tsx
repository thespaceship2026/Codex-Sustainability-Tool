// Perspective — editorial essay + "Thrive Lab" course bridge card.
// Purely static copy for v2. If we want this to rotate per-week later,
// lift the copy into a CMS or a data file.

export function Perspective() {
  return (
    <section className="section wrap perspective">
      <div className="hdr">
        <div className="title">
          <div className="eyebrow">
            <span className="dot" />
            HIGH ORBIT <span className="sep">·</span> PERSPECTIVE
          </div>
        </div>
      </div>

      <div className="lead-row">
        <h2>
          Three flights can quietly undo a year of{" "}
          <span className="italic">everything else</span> you&rsquo;re doing.
        </h2>

        <div className="body">
          <p className="first">
            The hardest part of climate literacy isn&rsquo;t caring. It&rsquo;s scale.
            We all carry an intuition that says a plastic straw and a
            transatlantic flight are both &ldquo;bad for the environment&rdquo; — and
            that one canvas bag and one electric car are both &ldquo;good.&rdquo; That
            intuition is generous, and it is almost entirely wrong.
          </p>

          <div className="pullquote">
            The ground gets closer when you pick the right mountain to descend,
            not when you pick up more pebbles.
          </div>

          <p>
            Orbit is built to fix that. Not by moralising, and not by handing
            you a forty-item checklist, but by showing you — honestly — which of
            your choices are big, which are small, and which are invisible.
            Most people are surprised by at least one of the three.
          </p>

          <p>
            Your starmap this week is telling you a useful story: your home
            baseline is settled, your flight question is open, and your food
            picture is sketched. That&rsquo;s exactly the right place to look next.
          </p>
        </div>
      </div>

      <div id="bridge" className="course-bridge">
        <div>
          <div className="kicker">
            COURSE BRIDGE <span style={{ color: "var(--ink-5)" }}>·</span> FROM UNDERSTANDING TO ACTION
          </div>
          <h3>
            Ready to go deeper? <span className="italic">Thrive Lab</span> is where this gets real.
          </h3>
          <p>
            One week at The Hun School of Princeton. Nine days of systems
            thinking, planetary boundaries, and the kind of learning that
            changes the way you see every decision you&rsquo;ll make this year.
            Grades 9–12 · Summer 2026.
          </p>
        </div>
        <a
          className="btn btn-mint"
          href="https://www.hunschool.org/summer/summer-leadership-institute"
          target="_blank"
          rel="noreferrer"
        >
          Explore the programme
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
    </section>
  );
}
