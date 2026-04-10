// Orbit v2 — Signal calculation
//
// Takes a traveller's mission answers and emission factors and produces
// the Signal readout: a 0–100 score, a monthly tCO2e estimate, and a
// category breakdown (home / flights / food / digital).
//
// Design notes:
//
// 1. Missing answers are OK. Every category falls back to a reasonable
//    default so the signal is never zero out of the gate. Instead, the
//    fewer the missions lit, the lower the confidence — reflected in
//    the `confidence` field on the return value.
//
// 2. Home electricity and heating are household-scope, divided by the
//    number of people in the home. Cars, transit, flights, food and
//    digital are personal and not divided.
//
// 3. Factor snapshotting happens when an answer is written, not here.
//    This function reads the current factor table.

import type { MissionKey, MissionStatus } from "./missions";
import {
  ALL_FACTORS,
  CABIN_MULTIPLIER,
  FAIR_SHARE_TCO2E_MONTH,
  GLOBAL_AVG_TCO2E_MONTH,
  getFactor,
  type FactorRow
} from "./factors";
import type { SignalBreakdown, Trajectory } from "./types";

// ────────────────────────────────────────────────────────────────────────────
// Input shape — matches rows from MissionAnswer but is framework-agnostic.
// ────────────────────────────────────────────────────────────────────────────

export type AnswerInput = {
  missionKey: MissionKey;
  questionKey: string;
  valueNum?: number | null;
  valueStr?: string | null;
  valueBool?: boolean | null;
};

export type MissionStateInput = {
  key: MissionKey;
  status: MissionStatus;
};

export type SignalInputs = {
  answers: AnswerInput[];
  missions: MissionStateInput[];
  factors?: FactorRow[];
};

export type SignalResult = {
  score: number;
  trajectory: Trajectory;
  monthlyTCO2e: number;
  breakdown: SignalBreakdown;
  missionsLit: number;
  fairShareMonthly: number;
  globalAvgMonthly: number;
  confidence: number; // 0..1
};

// ────────────────────────────────────────────────────────────────────────────
// Small helpers
// ────────────────────────────────────────────────────────────────────────────

function pickAnswer(
  answers: AnswerInput[],
  missionKey: MissionKey,
  questionKey: string
): AnswerInput | null {
  return answers.find((a) => a.missionKey === missionKey && a.questionKey === questionKey) ?? null;
}

function num(
  answers: AnswerInput[],
  missionKey: MissionKey,
  questionKey: string,
  fallback: number
): number {
  const a = pickAnswer(answers, missionKey, questionKey);
  return typeof a?.valueNum === "number" ? a.valueNum : fallback;
}

function str(
  answers: AnswerInput[],
  missionKey: MissionKey,
  questionKey: string,
  fallback: string
): string {
  const a = pickAnswer(answers, missionKey, questionKey);
  return typeof a?.valueStr === "string" ? a.valueStr : fallback;
}

function bool(
  answers: AnswerInput[],
  missionKey: MissionKey,
  questionKey: string,
  fallback: boolean
): boolean {
  const a = pickAnswer(answers, missionKey, questionKey);
  return typeof a?.valueBool === "boolean" ? a.valueBool : fallback;
}

function kgToT(kg: number): number {
  return kg / 1000;
}

// ────────────────────────────────────────────────────────────────────────────
// Home — electricity + heating + ground transport
// ────────────────────────────────────────────────────────────────────────────

function calcHome(answers: AnswerInput[], factors: FactorRow[]): number {
  const people = Math.max(1, num(answers, "HOME_BASELINE", "home.people", 2));
  const sqm = num(answers, "HOME_BASELINE", "home.sqm", 80);
  const kwhMonth = num(answers, "HOME_BASELINE", "home.electricity_kwh_month", 280);
  const country = str(answers, "HOME_BASELINE", "home.country", "US");
  const heatingFuel = str(answers, "HOME_BASELINE", "home.heating_fuel", "gas");
  const heatingIntensity = str(answers, "HOME_BASELINE", "home.heating_intensity", "medium");
  const roomsHeated = num(answers, "HOME_BASELINE", "home.rooms_heated", 3);
  const renewable = bool(answers, "HOME_BASELINE", "home.renewable", false);
  const carOwnership = str(answers, "HOME_BASELINE", "home.car_ownership", "none");
  const carKmWk = num(answers, "HOME_BASELINE", "home.car_km_week", 0);
  const transitKmWk = num(answers, "HOME_BASELINE", "home.transit_km_week", 40);

  // Electricity — household, divided by people.
  const gridCategory = `HOME_ELECTRICITY_${country}`;
  const grid =
    getFactor(gridCategory, factors) ?? getFactor("HOME_ELECTRICITY_OTHER", factors);
  const gridFactor = grid ? grid.factor : 0.475;
  const renewableMultiplier = renewable ? 0.25 : 1.0;
  const electricityKg = (kwhMonth * gridFactor * renewableMultiplier) / people;

  // Heating — annual kWh estimate from sqm + intensity, spread across 12 months.
  // Baselines (kWh per m² per year): low 70, medium 110, high 160.
  // Rooms-heated ratio nudges it within bounds of reason.
  const intensityKwhPerSqm =
    heatingIntensity === "low" ? 70 : heatingIntensity === "high" ? 160 : 110;
  const roomRatio = Math.max(0.4, Math.min(1.2, roomsHeated / 4));
  const annualHeatKwh = sqm * intensityKwhPerSqm * roomRatio;
  const monthlyHeatKwh = annualHeatKwh / 12;

  let heatKg = 0;
  if (heatingFuel === "gas") {
    heatKg = monthlyHeatKwh * (getFactor("HOME_GAS", factors)?.factor ?? 0.202);
  } else if (heatingFuel === "oil") {
    heatKg = monthlyHeatKwh * (getFactor("HOME_OIL", factors)?.factor ?? 0.267);
  } else if (heatingFuel === "district") {
    heatKg = monthlyHeatKwh * (getFactor("HOME_DISTRICT", factors)?.factor ?? 0.17);
  } else if (heatingFuel === "electric") {
    // Electric heat folds into the grid factor, but with a COP boost assumed
    // for heat pumps. We apply a 0.4 multiplier (heat pump-ish) rather than
    // double-counting kWh that's already in the bill estimate.
    heatKg = monthlyHeatKwh * gridFactor * renewableMultiplier * 0.4;
  } else {
    heatKg = 0;
  }
  heatKg = heatKg / people;

  // Ground transport — personal.
  let carKg = 0;
  const weeklyToMonthly = 52 / 12;
  const carMonthly = carKmWk * weeklyToMonthly;
  if (carOwnership === "petrol") {
    carKg = carMonthly * (getFactor("CAR_PETROL", factors)?.factor ?? 0.192);
  } else if (carOwnership === "hybrid") {
    carKg = carMonthly * (getFactor("CAR_HYBRID", factors)?.factor ?? 0.12);
  } else if (carOwnership === "ev") {
    carKg = carMonthly * (getFactor("CAR_EV", factors)?.factor ?? 0.053);
  } else if (carOwnership === "shared") {
    carKg = carMonthly * (getFactor("CAR_SHARED", factors)?.factor ?? 0.14);
  }

  const transitMonthly = transitKmWk * weeklyToMonthly;
  const transitKg = transitMonthly * (getFactor("TRANSIT_AVERAGE", factors)?.factor ?? 0.06);

  return kgToT(electricityKg + heatKg + carKg + transitKg);
}

// ────────────────────────────────────────────────────────────────────────────
// Flights — per-trip, per-year, spread monthly
// ────────────────────────────────────────────────────────────────────────────

function calcFlights(answers: AnswerInput[], factors: FactorRow[]): number {
  const short = num(answers, "FLIGHT_QUESTION", "flight.shorthaul_count", 0);
  const medium = num(answers, "FLIGHT_QUESTION", "flight.mediumhaul_count", 0);
  const long = num(answers, "FLIGHT_QUESTION", "flight.longhaul_count", 0);
  const cabin = str(answers, "FLIGHT_QUESTION", "flight.cabin_class", "economy");
  const intent = str(answers, "FLIGHT_QUESTION", "flight.intent", "");

  // If explicit counts are all zero but the intent question points somewhere,
  // derive a sensible fallback so the signal responds to the first answer.
  let sCount = short;
  let mCount = medium;
  let lCount = long;
  if (sCount === 0 && mCount === 0 && lCount === 0 && intent) {
    if (intent === "one_short") sCount = 1;
    else if (intent === "one_long") lCount = 1;
    else if (intent === "two_plus") {
      sCount = 1;
      mCount = 1;
    } else if (intent === "frequent") {
      sCount = 8;
      mCount = 4;
    }
  }

  const cabinMult = CABIN_MULTIPLIER[cabin] ?? 1.0;

  const shortKg =
    sCount * (getFactor("FLIGHT_SHORT", factors)?.factor ?? 460) * cabinMult;
  const mediumKg =
    mCount * (getFactor("FLIGHT_MEDIUM", factors)?.factor ?? 1100) * cabinMult;
  const longKg =
    lCount * (getFactor("FLIGHT_LONG", factors)?.factor ?? 2900) * cabinMult;

  // All flight numbers are annual — spread across 12 months.
  return kgToT((shortKg + mediumKg + longKg) / 12);
}

// ────────────────────────────────────────────────────────────────────────────
// Food — monthly
//
// We convert the diet_type answer into a rough daily meal mix, then add beef
// and delivery overrides, waste multiplier, and a small local/seasonal bonus.
// ────────────────────────────────────────────────────────────────────────────

type MealMix = {
  beef: number; // meals/day
  pork: number;
  chicken: number;
  fish: number;
  vegetarian: number;
  vegan: number;
};

function dietToMealMix(diet: string): MealMix {
  switch (diet) {
    case "heavy_meat":
      return { beef: 0.5, pork: 0.4, chicken: 0.7, fish: 0.1, vegetarian: 0.8, vegan: 0.5 };
    case "meat":
      return { beef: 0.2, pork: 0.3, chicken: 0.8, fish: 0.2, vegetarian: 1.0, vegan: 0.5 };
    case "flexitarian":
      return { beef: 0.1, pork: 0.2, chicken: 0.4, fish: 0.2, vegetarian: 1.3, vegan: 0.8 };
    case "pescatarian":
      return { beef: 0, pork: 0, chicken: 0, fish: 0.7, vegetarian: 1.5, vegan: 0.8 };
    case "vegetarian":
      return { beef: 0, pork: 0, chicken: 0, fish: 0, vegetarian: 2.0, vegan: 1.0 };
    case "vegan":
      return { beef: 0, pork: 0, chicken: 0, fish: 0, vegetarian: 0, vegan: 3.0 };
    default:
      return { beef: 0.1, pork: 0.2, chicken: 0.4, fish: 0.2, vegetarian: 1.3, vegan: 0.8 };
  }
}

function calcFood(answers: AnswerInput[], factors: FactorRow[]): number {
  const diet = str(answers, "FOOD_CHOICES", "food.diet_type", "flexitarian");
  const beefPerWeek = num(answers, "FOOD_CHOICES", "food.beef_meals_week", -1);
  const dairyIntensity = str(answers, "FOOD_CHOICES", "food.dairy_intensity", "medium");
  const waste = str(answers, "FOOD_CHOICES", "food.waste", "medium");
  const localSeasonal = bool(answers, "FOOD_CHOICES", "food.local_seasonal", false);
  const deliveryFreq = str(answers, "FOOD_CHOICES", "food.delivery_freq", "weekly");

  const mix = dietToMealMix(diet);
  if (beefPerWeek >= 0) {
    // Let the explicit beef count override the dietary default.
    mix.beef = beefPerWeek / 7;
  }

  const f = (cat: string, fallback: number) =>
    getFactor(cat, factors)?.factor ?? fallback;

  // Daily kg, then × 30 for the month.
  const dailyKg =
    mix.beef * f("FOOD_BEEF_MEAL", 7.2) +
    mix.pork * f("FOOD_PORK_MEAL", 2.4) +
    mix.chicken * f("FOOD_CHICKEN_MEAL", 1.5) +
    mix.fish * f("FOOD_FISH_MEAL", 1.8) +
    mix.vegetarian * f("FOOD_VEGETARIAN_MEAL", 0.9) +
    mix.vegan * f("FOOD_VEGAN_MEAL", 0.5);

  let foodKg = dailyKg * 30;

  // Dairy days/month on top of meal mix (vegans skip).
  if (diet !== "vegan") {
    const dairyDays =
      dairyIntensity === "heavy"
        ? 30
        : dairyIntensity === "medium"
        ? 22
        : dairyIntensity === "light"
        ? 12
        : 0;
    foodKg += dairyDays * f("FOOD_DAIRY_DAY", 1.3);
  }

  // Waste multiplier.
  const wasteMultiplier =
    waste === "very_low" ? 1.0 : waste === "low" ? 1.1 : waste === "high" ? 1.4 : 1.25;
  foodKg *= wasteMultiplier;

  // Local/seasonal — small 5% reduction.
  if (localSeasonal) foodKg *= 0.95;

  // Delivery — add per-order footprint.
  const ordersPerMonth =
    deliveryFreq === "multi" ? 12 : deliveryFreq === "weekly" ? 4 : 0;
  foodKg += ordersPerMonth * f("FOOD_DELIVERY_ORDER", 1.1);

  return kgToT(foodKg);
}

// ────────────────────────────────────────────────────────────────────────────
// Digital — streaming + cloud + devices + AI
// ────────────────────────────────────────────────────────────────────────────

function calcDigital(answers: AnswerInput[], factors: FactorRow[]): number {
  const hoursDay = num(answers, "DIGITAL_CARBON", "digital.streaming_hours_day", 2);
  const cloud = str(answers, "DIGITAL_CARBON", "digital.cloud_gb", "200gb");
  const devices = num(answers, "DIGITAL_CARBON", "digital.devices", 3);
  const ai = str(answers, "DIGITAL_CARBON", "digital.ai_usage", "daily");

  const f = (cat: string, fallback: number) =>
    getFactor(cat, factors)?.factor ?? fallback;

  const streamingKg = hoursDay * 30 * f("DIGITAL_STREAMING_HOUR", 0.036);

  const cloudGb =
    cloud === "none"
      ? 0
      : cloud === "50gb"
      ? 50
      : cloud === "200gb"
      ? 200
      : cloud === "1tb"
      ? 1000
      : cloud === "2tb_plus"
      ? 2000
      : 0;
  const cloudKg = cloudGb * f("DIGITAL_CLOUD_GB_MONTH", 0.01);

  const deviceKg = (devices * f("DIGITAL_DEVICE_YEAR", 22)) / 12;

  const aiDays =
    ai === "heavy" ? 30 : ai === "daily" ? 22 : ai === "light" ? 10 : 0;
  const aiKg = aiDays * f("DIGITAL_AI_DAILY", 0.08);

  return kgToT(streamingKg + cloudKg + deviceKg + aiKg);
}

// ────────────────────────────────────────────────────────────────────────────
// Score — 0..100, with fair-share anchored calibration
//
// Piecewise:
//   tCO2e ≤ fair_share           → 100
//   fair_share..global_avg       → 100..60 (linear)
//   global_avg..2 × global_avg   → 60..20 (linear)
//   ≥ 2 × global_avg             → 20..0  (clamped)
//
// Then add mission bonus: +2 per mission lit (max 8), clamped to 100.
// ────────────────────────────────────────────────────────────────────────────

function calcBaseScore(monthlyTCO2e: number): number {
  if (monthlyTCO2e <= FAIR_SHARE_TCO2E_MONTH) return 100;

  const global = GLOBAL_AVG_TCO2E_MONTH;
  const fair = FAIR_SHARE_TCO2E_MONTH;

  if (monthlyTCO2e <= global) {
    const t = (monthlyTCO2e - fair) / (global - fair);
    return Math.round(100 - t * 40); // 100 → 60
  }

  if (monthlyTCO2e <= global * 2) {
    const t = (monthlyTCO2e - global) / global;
    return Math.round(60 - t * 40); // 60 → 20
  }

  if (monthlyTCO2e <= global * 3) {
    const t = (monthlyTCO2e - global * 2) / global;
    return Math.max(0, Math.round(20 - t * 20)); // 20 → 0
  }

  return 0;
}

function countMissionsLit(missions: MissionStateInput[]): number {
  return missions.filter((m) => m.status === "LIT").length;
}

function calcTrajectory(
  currentMonthly: number,
  previousMonthly: number | null
): Trajectory {
  if (previousMonthly == null) return "STEADY";
  const delta = currentMonthly - previousMonthly;
  const relative = Math.abs(delta) / Math.max(0.05, previousMonthly);
  if (relative < 0.03) return "STEADY";
  if (delta < 0) return currentMonthly < FAIR_SHARE_TCO2E_MONTH * 1.5 ? "SETTLING" : "DRIFTING";
  return "CLIMBING";
}

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

export function calculateSignal(
  inputs: SignalInputs,
  previousMonthlyTCO2e: number | null = null
): SignalResult {
  const factors = inputs.factors ?? ALL_FACTORS;

  const home = calcHome(inputs.answers, factors);
  const flights = calcFlights(inputs.answers, factors);
  const food = calcFood(inputs.answers, factors);
  const digital = calcDigital(inputs.answers, factors);

  const breakdown: SignalBreakdown = { home, flights, food, digital };
  const monthlyTCO2e = home + flights + food + digital;

  const missionsLit = countMissionsLit(inputs.missions);
  const baseScore = calcBaseScore(monthlyTCO2e);
  const score = Math.min(100, baseScore + missionsLit * 2);

  // Confidence reflects how many missions have real data behind them.
  // Each lit mission contributes 0.25. A partial mission contributes 0.1.
  const partialCount = inputs.missions.filter((m) => m.status === "PARTIAL").length;
  const confidence = Math.min(1, missionsLit * 0.25 + partialCount * 0.1);

  const trajectory = calcTrajectory(monthlyTCO2e, previousMonthlyTCO2e);

  return {
    score,
    trajectory,
    monthlyTCO2e,
    breakdown,
    missionsLit,
    fairShareMonthly: FAIR_SHARE_TCO2E_MONTH,
    globalAvgMonthly: GLOBAL_AVG_TCO2E_MONTH,
    confidence
  };
}
