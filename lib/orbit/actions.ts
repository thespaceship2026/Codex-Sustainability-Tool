// Orbit v2 — Server-side mutations
//
// These are the writes API routes (and server actions) share. All of them
// operate on a single traveller and keep the derived state (mission status,
// signal snapshot, log entries) consistent.
//
// None of these functions return HTTP responses — that's the route's job.
// They just return plain objects the caller can serialise however it wants.

import { prisma } from "../prisma";
import { ALL_FACTORS } from "./factors";
import { MISSIONS, type MissionKey, type MissionStatus } from "./missions";
import { calcMissionProgress, calcMissionStatus } from "./progress";
import { calculateSignal, type AnswerInput } from "./signal";
import type { SignalView } from "./types";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export type AnswerUpsert = {
  questionKey: string;
  valueNum?: number | null;
  valueStr?: string | null;
  valueBool?: boolean | null;
};

export type SaveAnswersResult = {
  missionKey: MissionKey;
  previousStatus: MissionStatus;
  newStatus: MissionStatus;
  progress: number;
  signal: SignalView;
  missionLit: boolean; // true if this save lit the mission for the first time
};

// ────────────────────────────────────────────────────────────────────────────
// saveMissionAnswers — the workhorse
//
// Steps:
//   1. Resolve the traveller.
//   2. Upsert each answer on the (traveller, mission, question) unique index.
//   3. Recompute mission status + progress and persist it.
//   4. Rerun the signal calculation across *all* the traveller's answers.
//   5. Write a SignalSnapshot if we're in a new ISO week (otherwise update
//      the current one).
//   6. If the mission just transitioned LIT, drop a LogEntry celebrating it.
//
// Returns enough information for the caller to re-render the dashboard
// without having to reload the whole page.
// ────────────────────────────────────────────────────────────────────────────

export async function saveMissionAnswers(
  travellerId: string,
  missionKey: MissionKey,
  answers: AnswerUpsert[]
): Promise<SaveAnswersResult> {
  const mission = MISSIONS[missionKey];
  if (!mission) {
    throw new Error(`Unknown mission: ${missionKey}`);
  }

  // Validate each answer matches a known question in this mission.
  const knownKeys = new Set(mission.questions.map((q) => q.key));
  for (const a of answers) {
    if (!knownKeys.has(a.questionKey)) {
      throw new Error(
        `Unknown question '${a.questionKey}' for mission ${missionKey}`
      );
    }
  }

  // Capture the factor snapshot that's in effect at write time so the
  // historical answer can be recomputed later even if factors change.
  const factorSnapshot = ALL_FACTORS.map((f) => ({
    category: f.category,
    unit: f.unit,
    factor: f.factor
  }));

  // ── 1-2. Upsert answers in a single transaction ───────────────────────
  await prisma.$transaction(
    answers.map((a) =>
      prisma.missionAnswer.upsert({
        where: {
          travellerId_missionKey_questionKey: {
            travellerId,
            missionKey,
            questionKey: a.questionKey
          }
        },
        update: {
          valueNum: a.valueNum ?? null,
          valueStr: a.valueStr ?? null,
          valueBool: a.valueBool ?? null,
          factorSnapshot: factorSnapshot as unknown as object
        },
        create: {
          travellerId,
          missionKey,
          questionKey: a.questionKey,
          valueNum: a.valueNum ?? null,
          valueStr: a.valueStr ?? null,
          valueBool: a.valueBool ?? null,
          factorSnapshot: factorSnapshot as unknown as object
        }
      })
    )
  );

  // ── 3. Recompute mission status ────────────────────────────────────────
  const missionAnswers = await prisma.missionAnswer.findMany({
    where: { travellerId, missionKey }
  });

  const hasAnswer = (key: string) =>
    missionAnswers.some(
      (row: (typeof missionAnswers)[number]) => row.questionKey === key
    );

  const previousStateRow = await prisma.missionState.findUnique({
    where: {
      travellerId_key: { travellerId, key: missionKey }
    }
  });
  const previousStatus = (previousStateRow?.status as MissionStatus) ?? "LOCKED";

  const progress = calcMissionProgress(mission, hasAnswer);
  const newStatus = calcMissionStatus(mission, hasAnswer, previousStatus);
  const missionLit = previousStatus !== "LIT" && newStatus === "LIT";

  await prisma.missionState.upsert({
    where: {
      travellerId_key: { travellerId, key: missionKey }
    },
    update: {
      status: newStatus,
      progress,
      startedAt:
        previousStateRow?.startedAt ?? (progress > 0 ? new Date() : null),
      completedAt: missionLit
        ? new Date()
        : (previousStateRow?.completedAt ?? null)
    },
    create: {
      travellerId,
      key: missionKey,
      status: newStatus,
      progress,
      startedAt: progress > 0 ? new Date() : null,
      completedAt: newStatus === "LIT" ? new Date() : null
    }
  });

  // ── 4. Recompute signal across all answers ────────────────────────────
  const allAnswers = await prisma.missionAnswer.findMany({
    where: { travellerId }
  });
  const allStates = await prisma.missionState.findMany({
    where: { travellerId }
  });

  const answerInputs: AnswerInput[] = allAnswers.map(
    (a: (typeof allAnswers)[number]) => ({
      missionKey: a.missionKey as MissionKey,
      questionKey: a.questionKey,
      valueNum: a.valueNum,
      valueStr: a.valueStr,
      valueBool: a.valueBool
    })
  );

  const previousSnapshot = await prisma.signalSnapshot.findFirst({
    where: { travellerId },
    orderBy: { createdAt: "desc" }
  });

  const computed = calculateSignal(
    {
      answers: answerInputs,
      missions: allStates.map((s: (typeof allStates)[number]) => ({
        key: s.key as MissionKey,
        status: s.status as MissionStatus
      }))
    },
    previousSnapshot ? previousSnapshot.monthlyTCO2e : null
  );

  // ── 5. Upsert SignalSnapshot for the current ISO week ─────────────────
  const now = new Date();
  const year = now.getFullYear();
  const week = isoWeekOfYear(now);

  await prisma.signalSnapshot.upsert({
    where: {
      travellerId_year_weekOfYear: {
        travellerId,
        year,
        weekOfYear: week
      }
    },
    update: {
      score: computed.score,
      trajectory: computed.trajectory,
      monthlyTCO2e: computed.monthlyTCO2e,
      breakdown: computed.breakdown as unknown as object,
      missionsLit: computed.missionsLit
    },
    create: {
      travellerId,
      year,
      weekOfYear: week,
      score: computed.score,
      trajectory: computed.trajectory,
      monthlyTCO2e: computed.monthlyTCO2e,
      breakdown: computed.breakdown as unknown as object,
      missionsLit: computed.missionsLit
    }
  });

  // ── 6. Log the mission lit moment ─────────────────────────────────────
  if (missionLit) {
    await prisma.logEntry.create({
      data: {
        travellerId,
        kind: "MISSION_PROGRESS",
        title: `${mission.title} lit.`,
        body: `Mission captured in full. ${mission.tagline}`,
        valueLabel: "MISSION LIT",
        missionKey
      }
    });
  }

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

  return {
    missionKey,
    previousStatus,
    newStatus,
    progress,
    signal,
    missionLit
  };
}

// ────────────────────────────────────────────────────────────────────────────
// activateMission — flip a LOCKED mission to ACTIVE when the user opens it
// ────────────────────────────────────────────────────────────────────────────

export async function activateMission(
  travellerId: string,
  missionKey: MissionKey
): Promise<void> {
  const existing = await prisma.missionState.findUnique({
    where: { travellerId_key: { travellerId, key: missionKey } }
  });

  if (existing?.status === "LIT" || existing?.status === "PARTIAL") {
    return; // Already in flight.
  }

  await prisma.missionState.upsert({
    where: { travellerId_key: { travellerId, key: missionKey } },
    update: {
      status: "ACTIVE",
      startedAt: existing?.startedAt ?? new Date()
    },
    create: {
      travellerId,
      key: missionKey,
      status: "ACTIVE",
      progress: 0,
      startedAt: new Date()
    }
  });
}

// ────────────────────────────────────────────────────────────────────────────
// quickLog — the floating dock entries (flight / meal / energy / trip)
// ────────────────────────────────────────────────────────────────────────────

export type QuickLogInput = {
  kind: "flight" | "meal" | "energy" | "trip";
  label?: string;
  body?: string;
  valueLabel?: string;
};

const QUICK_LOG_COPY: Record<
  QuickLogInput["kind"],
  { title: string; body: string }
> = {
  flight: {
    title: "Quick log · Flight",
    body: "A flight logged. It will show up in the next mission recalculation."
  },
  meal: {
    title: "Quick log · Meal",
    body: "A meal logged. Small moves compound across a week."
  },
  energy: {
    title: "Quick log · Energy",
    body: "An energy action logged. Keep stacking these."
  },
  trip: {
    title: "Quick log · Trip",
    body: "A trip logged. Active travel counts."
  }
};

export async function quickLog(travellerId: string, input: QuickLogInput) {
  const copy = QUICK_LOG_COPY[input.kind];
  const row = await prisma.logEntry.create({
    data: {
      travellerId,
      kind: "QUICK_LOG",
      title: input.label ?? copy.title,
      body: input.body ?? copy.body,
      valueLabel: input.valueLabel ?? null,
      missionKey: null
    }
  });
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    valueLabel: row.valueLabel,
    occurredAt: row.occurredAt.toISOString()
  };
}

// ────────────────────────────────────────────────────────────────────────────
// ISO week helper — shared with page.tsx but duplicated here so this file
// stays free of any client/server boundary imports.
// ────────────────────────────────────────────────────────────────────────────

function isoWeekOfYear(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
