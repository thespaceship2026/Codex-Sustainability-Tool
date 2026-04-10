import type {
  EmissionFactor,
  MonthlyMetric,
  Prisma,
  RecommendationRule,
  SustainabilityGoal
} from "@prisma/client";

import { categoryMeta, categoryOrder, type CategoryKey } from "@/lib/constants";
import { parseFactorSnapshot } from "@/lib/factor-versioning";
import { formatMonthFromParts } from "@/lib/utils";

type FactorValue = {
  factor: number;
  label?: string;
  unit?: string;
  version?: number;
  effectiveDate?: string | Date;
};

type FactorMap = Record<CategoryKey, FactorValue>;

export type MetricLike = {
  electricityKwh: number;
  waterM3: number;
  wasteKg: number;
  recyclingKg: number;
  businessTravelKm: number;
  commutingKm: number;
};

export type EmissionBreakdown = Record<CategoryKey, number>;

export function createFactorMap(factors: EmissionFactor[]) {
  return factors.reduce((acc, factor) => {
    acc[factor.category as CategoryKey] = factor;
    return acc;
  }, {} as FactorMap);
}

export function createFactorMapFromSnapshot(snapshotValue: Prisma.JsonValue | null | undefined) {
  const snapshot = parseFactorSnapshot(snapshotValue);

  if (!snapshot) {
    return null;
  }

  return categoryOrder.reduce((acc, category) => {
    acc[category] = snapshot[category];
    return acc;
  }, {} as FactorMap);
}

export function calculateEmissions(metric: MetricLike, factorMap: FactorMap) {
  // Each category formula is intentionally separated so founders can edit
  // a single line later without touching the rest of the calculation flow.
  const byCategory: EmissionBreakdown = {
    ELECTRICITY: metric.electricityKwh * factorMap.ELECTRICITY.factor,
    WATER: metric.waterM3 * factorMap.WATER.factor,
    WASTE: metric.wasteKg * factorMap.WASTE.factor,
    // Recycling acts as an avoided-emissions credit, so it subtracts impact.
    RECYCLING: metric.recyclingKg * factorMap.RECYCLING.factor * -1,
    BUSINESS_TRAVEL: metric.businessTravelKm * factorMap.BUSINESS_TRAVEL.factor,
    COMMUTING: metric.commutingKm * factorMap.COMMUTING.factor
  };

  const total = Object.values(byCategory).reduce((sum, value) => sum + value, 0);

  return { total, byCategory };
}

export function calculateStoredMetricEmissions(
  record: Pick<
    MonthlyMetric,
    | "electricityKwh"
    | "waterM3"
    | "wasteKg"
    | "recyclingKg"
    | "businessTravelKm"
    | "commutingKm"
  >,
  factorMap: FactorMap
) {
  return calculateEmissions(record, factorMap);
}

export function buildTrend(metrics: MonthlyMetric[]) {
  return metrics.map((metric) => ({
    label: formatMonthFromParts(metric.year, metric.month),
    totalEmissions: metric.calculatedTotalEmissionsKgCo2e
  }));
}

export function buildLatestBreakdown(
  latestMetric: MonthlyMetric | null,
  factors: EmissionFactor[],
  goals: SustainabilityGoal[]
) {
  const factorMap =
    createFactorMapFromSnapshot(latestMetric?.appliedFactorSnapshot) ?? createFactorMap(factors);
  const goalMap = goals.reduce(
    (acc, goal) => {
      acc[goal.category as CategoryKey] = goal;
      return acc;
    },
    {} as Record<CategoryKey, SustainabilityGoal>
  );

  if (!latestMetric) {
    return categoryOrder.map((category) => ({
      category,
      label: categoryMeta[category].label,
      unit: categoryMeta[category].unit,
      actual: 0,
      emissions: 0,
      target: goalMap[category]?.targetValue,
      targetMonth: goalMap[category]?.targetMonth,
      targetYear: goalMap[category]?.targetYear
    }));
  }

  const emissions = calculateStoredMetricEmissions(latestMetric, factorMap);
  const actuals: Record<CategoryKey, number> = {
    ELECTRICITY: latestMetric.electricityKwh,
    WATER: latestMetric.waterM3,
    WASTE: latestMetric.wasteKg,
    RECYCLING: latestMetric.recyclingKg,
    BUSINESS_TRAVEL: latestMetric.businessTravelKm,
    COMMUTING: latestMetric.commutingKm
  };

  return categoryOrder.map((category) => ({
    category,
    label: categoryMeta[category].label,
    unit: categoryMeta[category].unit,
    actual: actuals[category],
    emissions: emissions.byCategory[category],
    target: goalMap[category]?.targetValue,
    targetMonth: goalMap[category]?.targetMonth,
    targetYear: goalMap[category]?.targetYear
  }));
}

export function buildRecommendations(
  latestMetric: MonthlyMetric | null,
  factors: EmissionFactor[],
  rules: RecommendationRule[]
) {
  if (!latestMetric) {
    return [];
  }

  const factorMap =
    createFactorMapFromSnapshot(latestMetric.appliedFactorSnapshot) ?? createFactorMap(factors);
  const emissions = calculateStoredMetricEmissions(latestMetric, factorMap).byCategory;
  const ruleMap = rules.reduce(
    (acc, rule) => {
      const key = rule.category as CategoryKey;
      acc[key] ??= [];
      acc[key].push(rule);
      return acc;
    },
    {} as Record<CategoryKey, RecommendationRule[]>
  );

  return [...categoryOrder]
    .sort((left, right) => emissions[right] - emissions[left])
    .slice(0, 3)
    .map((category) => ({
      category,
      label: categoryMeta[category].label,
      impact: emissions[category],
      rules: (ruleMap[category] ?? [])
        .filter((rule) => rule.isActive)
        .sort((left, right) => left.priority - right.priority)
        .slice(0, 2)
    }));
}
