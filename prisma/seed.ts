// Orbit v2 — Seed script
//
// Populates the database with:
//   • the "solo" demo traveller
//   • the current emission factor catalogue (versioned)
//   • a realistic Week 14 scenario:
//       Mission 01 · HOME_BASELINE    → LIT (100%)
//       Mission 02 · FLIGHT_QUESTION  → ACTIVE (58%)
//       Mission 03 · FOOD_CHOICES     → PARTIAL (34%)
//       Mission 04 · DIGITAL_CARBON   → LOCKED
//   • a previous SignalSnapshot so the dashboard trajectory shows a delta
//   • an observation log with a mix of mission progress and quick entries
//
// Run with `npm run db:seed` (after `prisma generate` and either
// `db:push` or `db:migrate`).

import { PrismaClient } from "@prisma/client";
import { ALL_FACTORS } from "../lib/orbit/factors";
import { calculateSignal } from "../lib/orbit/signal";

const prisma = new PrismaClient();

async function main() {
  console.log("▶ Seeding Orbit v2 database…");

  // ──────────────────────────────────────────────────────────────────────
  // 1. Emission factors
  // ──────────────────────────────────────────────────────────────────────
  console.log("  • Emission factors");

  // Wipe and re-seed — keeps the script idempotent in dev.
  await prisma.emissionFactor.deleteMany();
  await prisma.emissionFactor.createMany({
    data: ALL_FACTORS.map((f) => ({
      category: f.category,
      label: f.label,
      unit: f.unit,
      factor: f.factor,
      version: 1,
      isCurrent: true,
      source: f.source ?? null,
      notes: f.notes ?? null
    }))
  });

  // ──────────────────────────────────────────────────────────────────────
  // 2. Traveller
  // ──────────────────────────────────────────────────────────────────────
  console.log("  • Traveller: solo");

  const traveller = await prisma.traveller.upsert({
    where: { handle: "solo" },
    update: { name: "You", mode: "SOLO" },
    create: { handle: "solo", name: "You", mode: "SOLO" }
  });

  // Clean slate for idempotency
  await prisma.missionAnswer.deleteMany({ where: { travellerId: traveller.id } });
  await prisma.missionState.deleteMany({ where: { travellerId: traveller.id } });
  await prisma.logEntry.deleteMany({ where: { travellerId: traveller.id } });
  await prisma.signalSnapshot.deleteMany({ where: { travellerId: traveller.id } });

  // ──────────────────────────────────────────────────────────────────────
  // 3. Mission states
  // ──────────────────────────────────────────────────────────────────────
  console.log("  • Mission states");

  const now = new Date();
  const daysAgo = (n: number) =>
    new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  await prisma.missionState.createMany({
    data: [
      {
        travellerId: traveller.id,
        key: "HOME_BASELINE",
        status: "LIT",
        progress: 100,
        startedAt: daysAgo(12),
        completedAt: daysAgo(5)
      },
      {
        travellerId: traveller.id,
        key: "FLIGHT_QUESTION",
        status: "ACTIVE",
        progress: 58,
        startedAt: daysAgo(4),
        completedAt: null
      },
      {
        travellerId: traveller.id,
        key: "FOOD_CHOICES",
        status: "PARTIAL",
        progress: 34,
        startedAt: daysAgo(2),
        completedAt: null
      },
      {
        travellerId: traveller.id,
        key: "DIGITAL_CARBON",
        status: "LOCKED",
        progress: 0,
        startedAt: null,
        completedAt: null
      }
    ]
  });

  // ──────────────────────────────────────────────────────────────────────
  // 4. Mission answers
  //
  // Numbers picked to land somewhere between fair-share and 2× global avg,
  // so the score is meaningful (roughly 50–70) and the trajectory is
  // settling rather than climbing.
  // ──────────────────────────────────────────────────────────────────────
  console.log("  • Mission answers");

  type AnswerSeed = {
    missionKey: string;
    questionKey: string;
    valueNum?: number;
    valueStr?: string;
    valueBool?: boolean;
  };

  const answers: AnswerSeed[] = [
    // Mission 01 — HOME_BASELINE (complete)
    { missionKey: "HOME_BASELINE", questionKey: "home.people", valueNum: 2 },
    { missionKey: "HOME_BASELINE", questionKey: "home.sqm", valueNum: 68 },
    { missionKey: "HOME_BASELINE", questionKey: "home.electricity_kwh_month", valueNum: 260 },
    { missionKey: "HOME_BASELINE", questionKey: "home.heating_fuel", valueStr: "gas" },
    { missionKey: "HOME_BASELINE", questionKey: "home.heating_intensity", valueStr: "moderate" },
    { missionKey: "HOME_BASELINE", questionKey: "home.renewable", valueBool: false },
    { missionKey: "HOME_BASELINE", questionKey: "home.car_ownership", valueStr: "shared" },
    { missionKey: "HOME_BASELINE", questionKey: "home.car_km_week", valueNum: 40 },
    { missionKey: "HOME_BASELINE", questionKey: "home.transit_km_week", valueNum: 90 },
    { missionKey: "HOME_BASELINE", questionKey: "home.bike_or_walk", valueStr: "often" },
    { missionKey: "HOME_BASELINE", questionKey: "home.rooms_heated", valueNum: 3 },
    { missionKey: "HOME_BASELINE", questionKey: "home.country", valueStr: "US" },

    // Mission 02 — FLIGHT_QUESTION (58% — intent + counts captured, still open)
    { missionKey: "FLIGHT_QUESTION", questionKey: "flight.intent", valueStr: "some_trips" },
    { missionKey: "FLIGHT_QUESTION", questionKey: "flight.shorthaul_count", valueNum: 2 },
    { missionKey: "FLIGHT_QUESTION", questionKey: "flight.mediumhaul_count", valueNum: 1 },
    { missionKey: "FLIGHT_QUESTION", questionKey: "flight.longhaul_count", valueNum: 1 },
    { missionKey: "FLIGHT_QUESTION", questionKey: "flight.cabin_class", valueStr: "economy" },

    // Mission 03 — FOOD_CHOICES (34% — a rough diet sketch)
    { missionKey: "FOOD_CHOICES", questionKey: "food.diet_type", valueStr: "flexitarian" },
    { missionKey: "FOOD_CHOICES", questionKey: "food.beef_meals_week", valueNum: 1 },
    { missionKey: "FOOD_CHOICES", questionKey: "food.dairy_intensity", valueStr: "moderate" }
  ];

  await prisma.missionAnswer.createMany({
    data: answers.map((a) => ({
      travellerId: traveller.id,
      missionKey: a.missionKey,
      questionKey: a.questionKey,
      valueNum: a.valueNum ?? null,
      valueStr: a.valueStr ?? null,
      valueBool: a.valueBool ?? null
    }))
  });

  // ──────────────────────────────────────────────────────────────────────
  // 5. Compute signal + drop a previous snapshot so trajectory has a delta
  // ──────────────────────────────────────────────────────────────────────
  console.log("  • Signal snapshot");

  const computed = calculateSignal(
    {
      answers: answers.map((a) => ({
        missionKey: a.missionKey as
          | "HOME_BASELINE"
          | "FLIGHT_QUESTION"
          | "FOOD_CHOICES"
          | "DIGITAL_CARBON",
        questionKey: a.questionKey,
        valueNum: a.valueNum ?? null,
        valueStr: a.valueStr ?? null,
        valueBool: a.valueBool ?? null
      })),
      missions: [
        { key: "HOME_BASELINE", status: "LIT" },
        { key: "FLIGHT_QUESTION", status: "ACTIVE" },
        { key: "FOOD_CHOICES", status: "PARTIAL" },
        { key: "DIGITAL_CARBON", status: "LOCKED" }
      ]
    },
    null
  );

  // Previous snapshot: slightly higher monthly (so current shows SETTLING).
  await prisma.signalSnapshot.create({
    data: {
      travellerId: traveller.id,
      year: now.getFullYear(),
      weekOfYear: Math.max(1, weekOfYear(now) - 1),
      score: Math.max(0, Math.min(100, computed.score - 4)),
      trajectory: "DRIFTING",
      monthlyTCO2e: computed.monthlyTCO2e * 1.06,
      breakdown: computed.breakdown as unknown as object,
      missionsLit: Math.max(0, computed.missionsLit - 1),
      createdAt: daysAgo(7)
    }
  });

  // ──────────────────────────────────────────────────────────────────────
  // 6. Observation log — the ship's log
  // ──────────────────────────────────────────────────────────────────────
  console.log("  • Observation log");

  await prisma.logEntry.createMany({
    data: [
      {
        travellerId: traveller.id,
        kind: "MISSION_PROGRESS",
        title: "Mission 01 lit.",
        body: "Home baseline captured — electricity, heat, and daily commute all on the map. Your orbit has its first anchor.",
        valueLabel: "+12 SIGNAL",
        missionKey: "HOME_BASELINE",
        occurredAt: daysAgo(5)
      },
      {
        travellerId: traveller.id,
        kind: "MISSION_PROGRESS",
        title: "Mission 02 in flight.",
        body: "You opened the flight question. Three short-haul, one medium, one long-haul named so far.",
        valueLabel: "—",
        missionKey: "FLIGHT_QUESTION",
        occurredAt: daysAgo(4)
      },
      {
        travellerId: traveller.id,
        kind: "INSIGHT",
        title: "One flight is carrying your year.",
        body: "Your single long-haul round trip is larger than your entire home baseline combined. That's normal — and it's also the first real lever.",
        valueLabel: "INSIGHT",
        missionKey: "FLIGHT_QUESTION",
        occurredAt: daysAgo(3)
      },
      {
        travellerId: traveller.id,
        kind: "QUICK_LOG",
        title: "Quick log · Energy",
        body: "Switched to nightly thermostat setback. Small move, but it shows up in the next bill.",
        valueLabel: "-0.02 tCO₂e / mo",
        missionKey: "HOME_BASELINE",
        occurredAt: daysAgo(2)
      },
      {
        travellerId: traveller.id,
        kind: "MISSION_PROGRESS",
        title: "Mission 03 drafting.",
        body: "Diet type and beef frequency captured. Dairy, waste, and delivery still to sketch in.",
        valueLabel: "34% DRAFT",
        missionKey: "FOOD_CHOICES",
        occurredAt: daysAgo(2)
      },
      {
        travellerId: traveller.id,
        kind: "QUICK_LOG",
        title: "Quick log · Meal",
        body: "Veg-forward dinner logged. Three in a row this week.",
        valueLabel: "STREAK",
        missionKey: "FOOD_CHOICES",
        occurredAt: daysAgo(1)
      },
      {
        travellerId: traveller.id,
        kind: "SYSTEM",
        title: "Signal recalculated.",
        body: "Weekly snapshot taken. Trajectory settling against last week's reading.",
        valueLabel: "SETTLING",
        missionKey: null,
        occurredAt: daysAgo(0)
      }
    ]
  });

  console.log(
    `✔ Seed complete. Signal ${computed.score}/100 · ${computed.monthlyTCO2e.toFixed(
      2
    )} tCO₂e/mo · ${computed.trajectory}`
  );
}

function weekOfYear(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
