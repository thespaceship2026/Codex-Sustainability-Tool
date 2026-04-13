// Orbit v2 — dashboard root page.
//
// Server component. Loads the current OrbitSnapshot once (via Prisma) and
// hands slices of it to each dashboard section. The OrbitExperience wrapper
// manages the three-phase flow: Quiz → Reveal → Dashboard.
//
// First-time visitors see the 5-question quiz. After the reveal (or if
// they've visited before in this session), they see the full dashboard.

import { loadOrbitSnapshot, DEFAULT_HANDLE } from "@/lib/orbit/data";
import { OrbitExperience } from "@/components/orbit/OrbitExperience";
import { TopNav } from "@/components/orbit/TopNav";
import { Hero } from "@/components/orbit/Hero";
import { Starmap } from "@/components/orbit/Starmap";
import { Descent } from "@/components/orbit/Descent";
import { Perspective } from "@/components/orbit/Perspective";
import { ObservationLog } from "@/components/orbit/ObservationLog";
import { MissionControlFooter } from "@/components/orbit/MissionControlFooter";

// Always render fresh on each request so the signal reflects the latest
// answers. Prisma + SQLite make this cheap in dev.
export const dynamic = "force-dynamic";

export default async function OrbitDashboardPage() {
  const snapshot = await loadOrbitSnapshot(DEFAULT_HANDLE);

  const now = new Date();
  const weekLabelShort = `W${weekOfYear(now)} · ${now.getFullYear()}`;
  const weekLabelLong = `WEEK ${weekOfYear(now)}`;
  const dateLabel = `${pad(now.getMonth() + 1)}/${pad(now.getDate())}`;
  const lastSyncLabel = `${pad(now.getHours())}:${pad(now.getMinutes())} · ${timezoneAbbrev(now)}`;

  return (
    <OrbitExperience>
      <TopNav
        snapshot={snapshot}
        weekLabel={weekLabelShort}
        dateLabel={dateLabel}
      />

      <Hero signal={snapshot.signal} weekLabel={weekLabelLong} />

      <Starmap missions={snapshot.missions} signal={snapshot.signal} />

      <Descent signal={snapshot.signal} />

      <Perspective
        signal={snapshot.signal.score}
        monthlyTCO2e={snapshot.signal.monthlyTCO2e}
      />

      <ObservationLog entries={snapshot.log} />

      <MissionControlFooter
        mode={snapshot.traveller.mode}
        lastSyncLabel={lastSyncLabel}
      />
    </OrbitExperience>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Tiny date helpers — kept local so we don't pull in a date-fns dependency.
// ────────────────────────────────────────────────────────────────────────────

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// ISO week number (Mon-start, first week contains Jan 4).
function weekOfYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return weekNo;
}

function timezoneAbbrev(date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short"
    }).formatToParts(date);
    const tz = parts.find((p) => p.type === "timeZoneName");
    return tz?.value ?? "UTC";
  } catch {
    return "UTC";
  }
}
