// Orbit v2 — Data loader
//
// Builds an OrbitSnapshot (the full server-side data object the dashboard
// page needs) from Prisma. All reads happen here so the page.tsx file can
// stay focused on rendering.

import { prisma } from "../prisma";
import { MISSION_LIST, type MissionKey, type MissionStatus } from "./missions";
import { calculateSignal, type AnswerInput } from "./signal";
import type {
  AnswerView,
  LogEntryView,
  LogKind,
  MissionStateView,
  OrbitSnapshot,
  SignalView
} from "./types";

// Default handle for the solo-mode demo.
export const DEFAULT_HANDLE = "solo";

// ────────────────────────────────────────────────────────────────────────────
// Traveller lookup / bootstrap
//
// If nobody exists yet, seed a stub so the dashboard has something to render
// on first run. The real seed script (prisma/seed.ts) fills in rich demo data.
// ────────────────────────────────────────────────────────────────────────────

export async function getOrCreateTraveller(handle: string = DEFAULT_HANDLE) {
  const existing = await prisma.traveller.findUnique({ where: { handle } });
  if (existing) return existing;

  return prisma.traveller.create({
    data: {
      handle,
      name: handle === "solo" ? "You" : handle,
      mode: "SOLO"
    }
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Load the full dashboard snapshot
// ────────────────────────────────────────────────────────────────────────────

export async function loadOrbitSnapshot(
  handle: string = DEFAULT_HANDLE
): Promise<OrbitSnapshot> {
  const traveller = await getOrCreateTraveller(handle);

  // Pull mission states. If none exist, hydrate from the mission list with
  // each in its default LOCKED/ACTIVE posture.
  const missionStates = await prisma.missionState.findMany({
    where: { travellerId: traveller.id }
  });

  const missionMap = new Map<MissionKey, MissionStateView>();
  for (const def of MISSION_LIST) {
    const row = missionStates.find((m: (typeof missionStates)[number]) => m.key === def.key);
    missionMap.set(def.key, {
      key: def.key,
      status: (row?.status as MissionStatus) ?? defaultStatusFor(def.key),
      progress: row?.progress ?? 0,
      startedAt: row?.startedAt ? row.startedAt.toISOString() : null,
      completedAt: row?.completedAt ? row.completedAt.toISOString() : null
    });
  }
  const missions = Array.from(missionMap.values());

  // Pull answers.
  const answers = await prisma.missionAnswer.findMany({
    where: { travellerId: traveller.id },
    orderBy: { updatedAt: "desc" }
  });

  const answerInputs: AnswerInput[] = answers.map(
    (a: (typeof answers)[number]) => ({
      missionKey: a.missionKey as MissionKey,
      questionKey: a.questionKey,
      valueNum: a.valueNum,
      valueStr: a.valueStr,
      valueBool: a.valueBool
    })
  );

  // Pull most recent snapshot (for trajectory delta) and log entries.
  const [previousSnapshot, logRows] = await Promise.all([
    prisma.signalSnapshot.findFirst({
      where: { travellerId: traveller.id },
      orderBy: { createdAt: "desc" }
    }),
    prisma.logEntry.findMany({
      where: { travellerId: traveller.id },
      orderBy: { occurredAt: "desc" },
      take: 10
    })
  ]);

  // Run the signal calc fresh from the answers so the dashboard always shows
  // a current number, even if the background snapshot is stale.
  const signalInputs = {
    answers: answerInputs,
    missions: missions.map((m) => ({ key: m.key, status: m.status }))
  };

  const computed = calculateSignal(
    signalInputs,
    previousSnapshot ? previousSnapshot.monthlyTCO2e : null
  );

  const signal: SignalView = {
    score: computed.score,
    trajectory: computed.trajectory,
    monthlyTCO2e: computed.monthlyTCO2e,
    breakdown: computed.breakdown,
    missionsLit: computed.missionsLit,
    fairShareMonthly: computed.fairShareMonthly,
    globalAvgMonthly: computed.globalAvgMonthly,
    updatedAt: new Date().toISOString()
  };

  const recentAnswers: AnswerView[] = answerInputs.slice(0, 12);

  const log: LogEntryView[] = logRows.map(
    (row: (typeof logRows)[number]) => ({
      id: row.id,
      kind: row.kind as LogKind,
      title: row.title,
      body: row.body,
      valueLabel: row.valueLabel,
      missionKey: (row.missionKey as MissionKey | null) ?? null,
      occurredAt: row.occurredAt.toISOString()
    })
  );

  return {
    traveller: {
      id: traveller.id,
      handle: traveller.handle,
      name: traveller.name,
      mode: (traveller.mode as OrbitSnapshot["traveller"]["mode"]) ?? "SOLO"
    },
    signal,
    missions,
    recentAnswers,
    log
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Defaults
// ────────────────────────────────────────────────────────────────────────────

function defaultStatusFor(key: MissionKey): MissionStatus {
  // First mission is ACTIVE by default, everything else LOCKED until
  // HOME_BASELINE is lit. This matches the dashboard's first-run posture.
  if (key === "HOME_BASELINE") return "ACTIVE";
  return "LOCKED";
}
