// Orbit v2 — Database health check.
//
// A smoke test you can run after a seed or a migration to confirm the
// database looks sane. Reports counts and flags obvious inconsistencies
// (missing factor categories, travellers with no mission state, etc.).

import { PrismaClient } from "@prisma/client";
import { ALL_FACTORS } from "../lib/orbit/factors";
import { MISSION_KEYS } from "../lib/orbit/missions";

const prisma = new PrismaClient();

async function main() {
  const issues: string[] = [];

  const [
    travellerCount,
    missionStateCount,
    answerCount,
    logCount,
    snapshotCount,
    currentFactors
  ] = await Promise.all([
    prisma.traveller.count(),
    prisma.missionState.count(),
    prisma.missionAnswer.count(),
    prisma.logEntry.count(),
    prisma.signalSnapshot.count(),
    prisma.emissionFactor.findMany({ where: { isCurrent: true } })
  ]);

  if (travellerCount === 0) {
    issues.push("No traveller found. Run `npm run db:seed`.");
  }

  if (currentFactors.length === 0) {
    issues.push("No current emission factors. Run `npm run db:seed`.");
  }

  // Check every factor category from the seed catalogue is represented.
  const currentCategories = new Set(
    currentFactors.map((f: (typeof currentFactors)[number]) => f.category)
  );
  for (const factor of ALL_FACTORS) {
    if (!currentCategories.has(factor.category)) {
      issues.push(`Missing current factor for category ${factor.category}.`);
    }
  }

  // Every traveller should have a MissionState row per known mission.
  const travellers = await prisma.traveller.findMany({
    select: { id: true, handle: true }
  });
  for (const t of travellers as Array<{ id: string; handle: string }>) {
    const states = await prisma.missionState.findMany({
      where: { travellerId: t.id },
      select: { key: true }
    });
    const keys = new Set(
      (states as Array<{ key: string }>).map((s) => s.key)
    );
    for (const key of MISSION_KEYS) {
      if (!keys.has(key)) {
        issues.push(`Traveller ${t.handle} missing mission state for ${key}.`);
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        travellers: travellerCount,
        missionStates: missionStateCount,
        answers: answerCount,
        logs: logCount,
        snapshots: snapshotCount,
        currentFactors: currentFactors.length,
        issues
      },
      null,
      2
    )
  );

  if (issues.length > 0) {
    process.exit(1);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
