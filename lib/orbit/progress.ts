// Orbit v2 — Mission progress helpers
//
// Pure functions. Given a mission definition and the answers we've
// captured for it, decide:
//   • what percent of the mission is complete (0..100)
//   • what status the mission should be in (LOCKED | ACTIVE | PARTIAL | LIT)
//
// A mission is LIT once every required question has a value.
// A mission is PARTIAL if any answer exists but not all required are done.
// A mission is ACTIVE if it's been touched but has no answers yet (edge
// case — in practice ACTIVE is set when the user opens the mission).
// LOCKED is the default pre-touch state.

import type { Mission, MissionStatus } from "./missions";

export type AnswerLookup = (questionKey: string) => boolean;

export function calcMissionProgress(
  mission: Mission,
  hasAnswer: AnswerLookup
): number {
  const required = mission.questions.filter((q) => q.required);
  if (required.length === 0) return 100;
  const answered = required.filter((q) => hasAnswer(q.key)).length;
  return Math.round((answered / required.length) * 100);
}

export function calcMissionStatus(
  mission: Mission,
  hasAnswer: AnswerLookup,
  currentStatus: MissionStatus
): MissionStatus {
  const progress = calcMissionProgress(mission, hasAnswer);

  if (progress >= 100) return "LIT";

  // Any answers at all moves it from LOCKED/ACTIVE → PARTIAL.
  const anyAnswered = mission.questions.some((q) => hasAnswer(q.key));
  if (anyAnswered) return "PARTIAL";

  // No answers yet — keep whatever we were. If it's LOCKED and we're
  // being called, the caller is about to flip it to ACTIVE anyway.
  return currentStatus === "LIT" ? "PARTIAL" : currentStatus;
}
