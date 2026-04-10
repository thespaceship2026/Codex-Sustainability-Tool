// Orbit v2 — Mission detail page
//
// Server component. Resolves the mission config by key, loads any prior
// answers for the demo traveller, marks the mission ACTIVE if it was
// LOCKED, and hands everything to the shared <MissionForm />.
//
// One file handles all four missions thanks to the generic question
// renderer. Adding a mission means adding a config entry in missions.ts,
// not a new page.

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DEFAULT_HANDLE, getOrCreateTraveller } from "@/lib/orbit/data";
import { activateMission } from "@/lib/orbit/actions";
import { getMission, type MissionKey } from "@/lib/orbit/missions";
import { MissionForm } from "@/components/orbit/MissionForm";
import { loadOrbitSnapshot } from "@/lib/orbit/data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { key: string };
};

export default async function MissionPage({ params }: PageProps) {
  const mission = getMission(params.key.toUpperCase());
  if (!mission) {
    notFound();
  }

  const traveller = await getOrCreateTraveller(DEFAULT_HANDLE);

  // Mark the mission ACTIVE the first time the user opens it. Idempotent,
  // so refreshing the page is safe.
  await activateMission(traveller.id, mission.key as MissionKey);

  // Load any prior answers so the form can hydrate.
  const priorRows = await prisma.missionAnswer.findMany({
    where: { travellerId: traveller.id, missionKey: mission.key }
  });

  const priorAnswers: Record<
    string,
    { valueNum?: number | null; valueStr?: string | null; valueBool?: boolean | null }
  > = {};
  for (const row of priorRows as Array<{
    questionKey: string;
    valueNum: number | null;
    valueStr: string | null;
    valueBool: boolean | null;
  }>) {
    priorAnswers[row.questionKey] = {
      valueNum: row.valueNum,
      valueStr: row.valueStr,
      valueBool: row.valueBool
    };
  }

  const snapshot = await loadOrbitSnapshot(DEFAULT_HANDLE);

  return (
    <main className="wrap mission-page">
      <MissionForm
        mission={mission}
        priorAnswers={priorAnswers}
        signal={snapshot.signal}
      />
    </main>
  );
}
