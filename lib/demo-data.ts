import {
  AuditAction,
  AuditEntityType,
  MetricCategory,
  type AuditLog,
  type EmissionFactor,
  type MonthlyMetric,
  type Organization,
  type RecommendationRule,
  type SustainabilityGoal
} from "@prisma/client";

import { categoryOrder } from "@/lib/constants";
import { calculateEmissions, createFactorMap } from "@/lib/emissions";
import { serializeFactorSnapshot } from "@/lib/factor-versioning";

const demoOrganization: Organization = {
  id: "demo-org",
  name: "Northstar Goods",
  industry: "Consumer goods retail",
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-03-31T00:00:00.000Z")
};

const demoFactorDefinitions = [
  {
    id: "factor-electricity-v1",
    category: MetricCategory.ELECTRICITY,
    label: "Electricity grid factor",
    unit: "kg CO2e / kWh",
    factor: 0.233,
    description: "Average purchased electricity emissions factor."
  },
  {
    id: "factor-water-v1",
    category: MetricCategory.WATER,
    label: "Water supply factor",
    unit: "kg CO2e / m3",
    factor: 0.344,
    description: "Includes treatment and pumping."
  },
  {
    id: "factor-waste-v1",
    category: MetricCategory.WASTE,
    label: "Waste to landfill factor",
    unit: "kg CO2e / kg",
    factor: 0.587,
    description: "Default landfill disposal factor."
  },
  {
    id: "factor-recycling-v1",
    category: MetricCategory.RECYCLING,
    label: "Recycling avoided emissions factor",
    unit: "kg CO2e avoided / kg",
    factor: 0.221,
    description: "Recycling credit that reduces total emissions."
  },
  {
    id: "factor-business-travel-v1",
    category: MetricCategory.BUSINESS_TRAVEL,
    label: "Business travel factor",
    unit: "kg CO2e / km",
    factor: 0.171,
    description: "Blended short-haul air and car travel estimate."
  },
  {
    id: "factor-commuting-v1",
    category: MetricCategory.COMMUTING,
    label: "Employee commuting factor",
    unit: "kg CO2e / km",
    factor: 0.121,
    description: "Mixed transit and passenger vehicle commuting estimate."
  }
] as const;

const demoCurrentFactors: EmissionFactor[] = demoFactorDefinitions.map((factor) => ({
  ...factor,
  organizationId: demoOrganization.id,
  version: 1,
  effectiveDate: new Date("2025-01-01T00:00:00.000Z"),
  isCurrent: true,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z")
}));

const demoGoals: SustainabilityGoal[] = [
  {
    id: "goal-electricity",
    organizationId: demoOrganization.id,
    category: MetricCategory.ELECTRICITY,
    label: "Reduce electricity demand",
    unit: "kWh",
    targetValue: 900,
    targetYear: 2026,
    targetMonth: 12,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z")
  },
  {
    id: "goal-water",
    organizationId: demoOrganization.id,
    category: MetricCategory.WATER,
    label: "Reduce water usage",
    unit: "m3",
    targetValue: 36,
    targetYear: 2026,
    targetMonth: 12,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z")
  },
  {
    id: "goal-waste",
    organizationId: demoOrganization.id,
    category: MetricCategory.WASTE,
    label: "Reduce landfill waste",
    unit: "kg",
    targetValue: 115,
    targetYear: 2026,
    targetMonth: 12,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z")
  },
  {
    id: "goal-recycling",
    organizationId: demoOrganization.id,
    category: MetricCategory.RECYCLING,
    label: "Increase recycling volume",
    unit: "kg",
    targetValue: 84,
    targetYear: 2026,
    targetMonth: 12,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z")
  },
  {
    id: "goal-business-travel",
    organizationId: demoOrganization.id,
    category: MetricCategory.BUSINESS_TRAVEL,
    label: "Reduce travel distance",
    unit: "km",
    targetValue: 480,
    targetYear: 2026,
    targetMonth: 12,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z")
  },
  {
    id: "goal-commuting",
    organizationId: demoOrganization.id,
    category: MetricCategory.COMMUTING,
    label: "Reduce commuting distance",
    unit: "km",
    targetValue: 950,
    targetYear: 2026,
    targetMonth: 12,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z")
  }
];

const demoRecommendationRules: RecommendationRule[] = [
  {
    id: "rule-electricity-1",
    organizationId: demoOrganization.id,
    category: MetricCategory.ELECTRICITY,
    title: "Tune HVAC schedules",
    description: "Shift HVAC start and stop times to match real occupancy and reduce base load.",
    priority: 1,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z")
  },
  {
    id: "rule-electricity-2",
    organizationId: demoOrganization.id,
    category: MetricCategory.ELECTRICITY,
    title: "Upgrade persistent lighting zones",
    description: "Target storerooms, back offices, and exterior lights for LEDs and sensors first.",
    priority: 2,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z")
  },
  {
    id: "rule-water-1",
    organizationId: demoOrganization.id,
    category: MetricCategory.WATER,
    title: "Audit leaks and fixture flow rates",
    description: "Check washrooms, kitchens, and irrigation points for losses that add up monthly.",
    priority: 1,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z")
  },
  {
    id: "rule-waste-1",
    organizationId: demoOrganization.id,
    category: MetricCategory.WASTE,
    title: "Reduce landfill-bound materials",
    description: "Review top waste streams with staff and suppliers to remove avoidable disposables.",
    priority: 1,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z")
  },
  {
    id: "rule-recycling-1",
    organizationId: demoOrganization.id,
    category: MetricCategory.RECYCLING,
    title: "Improve diversion signage",
    description: "Place clear recycling signage at every mixed-waste station to increase capture rates.",
    priority: 1,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z")
  },
  {
    id: "rule-business-travel-1",
    organizationId: demoOrganization.id,
    category: MetricCategory.BUSINESS_TRAVEL,
    title: "Replace short trips with remote meetings",
    description: "Move internal and low-value in-person meetings online to cut avoidable travel.",
    priority: 1,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z")
  },
  {
    id: "rule-business-travel-2",
    organizationId: demoOrganization.id,
    category: MetricCategory.BUSINESS_TRAVEL,
    title: "Cluster field visits by region",
    description: "Plan sales and supplier visits in batches to reduce duplicate travel distances.",
    priority: 2,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z")
  },
  {
    id: "rule-commuting-1",
    organizationId: demoOrganization.id,
    category: MetricCategory.COMMUTING,
    title: "Expand hybrid work days",
    description: "Introduce or extend remote days for roles that do not need daily on-site presence.",
    priority: 1,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z")
  },
  {
    id: "rule-commuting-2",
    organizationId: demoOrganization.id,
    category: MetricCategory.COMMUTING,
    title: "Support lower-carbon commuting",
    description: "Offer transit, cycling, or carpool incentives to reduce single-occupancy car travel.",
    priority: 2,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z")
  }
];

const factorSnapshot = serializeFactorSnapshot(demoCurrentFactors);
const factorMap = createFactorMap(demoCurrentFactors);

const demoMetricInputs = [
  [2025, 4, 1160, 46, 168, 58, 640, 1280, "Spring product launch increased travel."],
  [2025, 5, 1128, 45, 162, 60, 610, 1250, "Utility optimization pilot started."],
  [2025, 6, 1095, 44, 156, 63, 590, 1230, "Warmer weather reduced heating needs."],
  [2025, 7, 1072, 43, 152, 66, 560, 1210, "First supplier review cut waste packaging."],
  [2025, 8, 1056, 42, 149, 68, 545, 1190, "Summer holiday schedules reduced commuting."],
  [2025, 9, 1038, 41, 146, 69, 570, 1185, "Travel picked up for seasonal planning."],
  [2025, 10, 1010, 41, 142, 71, 550, 1160, "Waste sorting signage updated."],
  [2025, 11, 986, 40, 139, 72, 520, 1135, "Remote Fridays reduced commute distance."],
  [2025, 12, 972, 39, 136, 74, 490, 1105, "Holiday slowdown trimmed travel further."],
  [2026, 1, 955, 39, 133, 75, 505, 1088, "Cold weather nudged energy use slightly."],
  [2026, 2, 942, 38, 129, 77, 488, 1052, "Landfill waste dropped after vendor changes."],
  [2026, 3, 928, 37, 125, 79, 472, 1015, "Best month so far after operations reset."]
] as const;

const demoMetrics: MonthlyMetric[] = demoMetricInputs.map(
  ([year, month, electricityKwh, waterM3, wasteKg, recyclingKg, businessTravelKm, commutingKm, notes], index) => {
    const emissions = calculateEmissions(
      { electricityKwh, waterM3, wasteKg, recyclingKg, businessTravelKm, commutingKm },
      factorMap
    );

    return {
      id: `metric-${year}-${month}`,
      organizationId: demoOrganization.id,
      year,
      month,
      electricityKwh,
      waterM3,
      wasteKg,
      recyclingKg,
      businessTravelKm,
      commutingKm,
      notes,
      calculatedTotalEmissionsKgCo2e: Number(emissions.total.toFixed(3)),
      appliedFactorSnapshot: factorSnapshot,
      createdAt: new Date(Date.UTC(year, month - 1, 1 + index)),
      updatedAt: new Date(Date.UTC(year, month - 1, 1 + index))
    };
  }
);

const demoAuditLogs: AuditLog[] = [
  {
    id: "audit-demo-1",
    organizationId: demoOrganization.id,
    entityType: AuditEntityType.MONTHLY_METRIC,
    entityId: "metric-2026-3",
    action: AuditAction.CREATE,
    snapshotBefore: null,
    snapshotAfter: null,
    createdAt: new Date("2026-03-31T09:30:00.000Z")
  }
];

export function getDemoDataset() {
  const missingCurrentFactors = categoryOrder.filter(
    (category) => !demoCurrentFactors.some((factor) => factor.category === category)
  );

  const currentFactorCounts = demoCurrentFactors.reduce<Record<string, number>>((acc, factor) => {
    if (factor.isCurrent) {
      acc[factor.category] = (acc[factor.category] ?? 0) + 1;
    }

    return acc;
  }, {});

  const duplicateCurrentFactorCategories = categoryOrder.filter(
    (category) => (currentFactorCounts[category] ?? 0) > 1
  );

  const metricsMissingSnapshots = demoMetrics.filter(
    (metric) => metric.appliedFactorSnapshot === null
  ).map((metric) => ({
    year: metric.year,
    month: metric.month,
    appliedFactorSnapshot: metric.appliedFactorSnapshot
  }));

  return {
    organization: demoOrganization,
    metrics: demoMetrics,
    factors: demoCurrentFactors,
    currentFactors: demoCurrentFactors,
    factorHistory: demoCurrentFactors,
    goals: demoGoals,
    recommendationRules: demoRecommendationRules,
    latestAuditLogs: demoAuditLogs,
    dataHealth: {
      missingCurrentFactors,
      duplicateCurrentFactorCategories,
      metricsMissingSnapshots,
      trackedMonths: demoMetrics.length
    }
  };
}
