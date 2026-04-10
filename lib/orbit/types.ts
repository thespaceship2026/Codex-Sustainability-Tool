// Orbit v2 — Shared types
//
// Types that both server and client components can import without pulling
// in Prisma's runtime client. Keep this file free of Prisma imports.

import type { MissionKey, MissionStatus } from "./missions";

export type Trajectory = "STEADY" | "DRIFTING" | "CLIMBING" | "SETTLING";

export type MissionStateView = {
  key: MissionKey;
  status: MissionStatus;
  progress: number; // 0..100
  startedAt: string | null;
  completedAt: string | null;
};

export type SignalBreakdown = {
  home: number; // tCO2e / month
  flights: number;
  food: number;
  digital: number;
};

export type SignalView = {
  score: number; // 0..100
  trajectory: Trajectory;
  monthlyTCO2e: number;
  breakdown: SignalBreakdown;
  missionsLit: number;
  fairShareMonthly: number;
  globalAvgMonthly: number;
  updatedAt: string; // ISO
};

export type AnswerView = {
  missionKey: MissionKey;
  questionKey: string;
  valueNum?: number | null;
  valueStr?: string | null;
  valueBool?: boolean | null;
};

export type LogKind = "MISSION_PROGRESS" | "QUICK_LOG" | "SYSTEM" | "INSIGHT";

export type LogEntryView = {
  id: string;
  kind: LogKind;
  title: string;
  body: string;
  valueLabel: string | null;
  missionKey: MissionKey | null;
  occurredAt: string; // ISO
};

export type OrbitSnapshot = {
  traveller: {
    id: string;
    handle: string;
    name: string;
    mode: "SOLO" | "HOUSEHOLD" | "CLASSROOM";
  };
  signal: SignalView;
  missions: MissionStateView[];
  recentAnswers: AnswerView[];
  log: LogEntryView[];
};
