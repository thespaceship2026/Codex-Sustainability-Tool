// ObservationLog — the "what actually happened" ledger.
// Renders log entries in two columns. Each entry shows a day stamp,
// a title, a body, and an optional value label.

import type { LogEntryView } from "@/lib/orbit/types";

type Props = {
  entries: LogEntryView[];
};

function formatTimestamp(iso: string): { day: string; rest: string } {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  return { day, rest: `${mm}/${dd} · ${hh}:${mn}` };
}

export function ObservationLog({ entries }: Props) {
  // Split into two columns, preserving chronological order.
  const half = Math.ceil(entries.length / 2);
  const left = entries.slice(0, half);
  const right = entries.slice(half);

  return (
    <section id="log" className="section wrap">
      <div className="hdr">
        <div className="title">
          <div className="eyebrow">
            <span className="dot" />
            OBSERVATION LOG <span className="sep">·</span> THIS WEEK
          </div>
          <h2>
            What <span className="italic">actually</span> happened.
          </h2>
        </div>
        <div className="hint">
          Every log entry is something you did —
          <br />
          or something the data noticed.
        </div>
      </div>

      {entries.length === 0 ? (
        <p
          style={{
            fontFamily: "Newsreader, Georgia, serif",
            fontStyle: "italic",
            fontWeight: 300,
            color: "var(--ink-3)",
            maxWidth: "56ch",
            fontSize: 16,
            lineHeight: 1.6
          }}
        >
          Nothing logged yet. Answer your first mission question and the ship&rsquo;s
          log will start filling itself in.
        </p>
      ) : (
        <div className="log-grid">
          <div>
            {left.map((e) => (
              <LogRow key={e.id} entry={e} />
            ))}
          </div>
          <div>
            {right.map((e) => (
              <LogRow key={e.id} entry={e} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function LogRow({ entry }: { entry: LogEntryView }) {
  const { day, rest } = formatTimestamp(entry.occurredAt);
  return (
    <div className="log-entry">
      <div className="ts">
        <span className="day">{day}</span>
        {rest}
      </div>
      <div>
        <h4>{entry.title}</h4>
        <p>{entry.body}</p>
        {entry.valueLabel && <span className="value">{entry.valueLabel}</span>}
      </div>
    </div>
  );
}
