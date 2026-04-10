import { MetricCategory, PrismaClient } from "@prisma/client";

import { calculateEmissions, createFactorMap } from "../lib/emissions";
import { serializeFactorSnapshot } from "../lib/factor-versioning";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.recommendationRule.deleteMany();
  await prisma.sustainabilityGoal.deleteMany();
  await prisma.emissionFactor.deleteMany();
  await prisma.monthlyMetric.deleteMany();
  await prisma.organization.deleteMany();

  const organization = await prisma.organization.create({
    data: {
      name: "Northstar Goods",
      industry: "Consumer goods retail"
    }
  });

  await prisma.user.create({
    data: {
      email: "founder@northstargoods.local",
      name: "Avery Chen",
      role: "admin",
      organizationId: organization.id
    }
  });

  const factorRecords = await Promise.all(
    [
      {
        category: MetricCategory.ELECTRICITY,
        label: "Electricity grid factor",
        unit: "kg CO2e / kWh",
        factor: 0.233,
        description: "Average purchased electricity emissions factor."
      },
      {
        category: MetricCategory.WATER,
        label: "Water supply factor",
        unit: "kg CO2e / m3",
        factor: 0.344,
        description: "Includes treatment and pumping."
      },
      {
        category: MetricCategory.WASTE,
        label: "Waste to landfill factor",
        unit: "kg CO2e / kg",
        factor: 0.587,
        description: "Default landfill disposal factor."
      },
      {
        category: MetricCategory.RECYCLING,
        label: "Recycling avoided emissions factor",
        unit: "kg CO2e avoided / kg",
        factor: 0.221,
        description: "Recycling credit that reduces total emissions."
      },
      {
        category: MetricCategory.BUSINESS_TRAVEL,
        label: "Business travel factor",
        unit: "kg CO2e / km",
        factor: 0.171,
        description: "Blended short-haul air and car travel estimate."
      },
      {
        category: MetricCategory.COMMUTING,
        label: "Employee commuting factor",
        unit: "kg CO2e / km",
        factor: 0.121,
        description: "Mixed transit and passenger vehicle commuting estimate."
      }
    ].map((item) =>
      prisma.emissionFactor.create({
        data: {
          ...item,
          organizationId: organization.id,
          version: 1,
          effectiveDate: new Date("2025-01-01T00:00:00.000Z"),
          isCurrent: true
        }
      })
    )
  );

  const factorMap = createFactorMap(factorRecords);
  const factorSnapshot = serializeFactorSnapshot(factorRecords);

  await prisma.sustainabilityGoal.createMany({
    data: [
      {
        organizationId: organization.id,
        category: MetricCategory.ELECTRICITY,
        label: "Reduce electricity demand",
        unit: "kWh",
        targetValue: 900,
        targetYear: 2026,
        targetMonth: 12
      },
      {
        organizationId: organization.id,
        category: MetricCategory.WATER,
        label: "Reduce water usage",
        unit: "m3",
        targetValue: 36,
        targetYear: 2026,
        targetMonth: 12
      },
      {
        organizationId: organization.id,
        category: MetricCategory.WASTE,
        label: "Reduce landfill waste",
        unit: "kg",
        targetValue: 115,
        targetYear: 2026,
        targetMonth: 12
      },
      {
        organizationId: organization.id,
        category: MetricCategory.RECYCLING,
        label: "Increase recycling volume",
        unit: "kg",
        targetValue: 84,
        targetYear: 2026,
        targetMonth: 12
      },
      {
        organizationId: organization.id,
        category: MetricCategory.BUSINESS_TRAVEL,
        label: "Reduce travel distance",
        unit: "km",
        targetValue: 480,
        targetYear: 2026,
        targetMonth: 12
      },
      {
        organizationId: organization.id,
        category: MetricCategory.COMMUTING,
        label: "Reduce commuting distance",
        unit: "km",
        targetValue: 950,
        targetYear: 2026,
        targetMonth: 12
      }
    ]
  });

  await prisma.recommendationRule.createMany({
    data: [
      {
        organizationId: organization.id,
        category: MetricCategory.ELECTRICITY,
        title: "Tune HVAC schedules",
        description: "Shift HVAC start and stop times to match real occupancy and reduce base load.",
        priority: 1
      },
      {
        organizationId: organization.id,
        category: MetricCategory.ELECTRICITY,
        title: "Upgrade persistent lighting zones",
        description: "Target storerooms, back offices, and exterior lights for LEDs and sensors first.",
        priority: 2
      },
      {
        organizationId: organization.id,
        category: MetricCategory.WATER,
        title: "Audit leaks and fixture flow rates",
        description: "Check washrooms, kitchens, and irrigation points for losses that add up monthly.",
        priority: 1
      },
      {
        organizationId: organization.id,
        category: MetricCategory.WASTE,
        title: "Reduce landfill-bound materials",
        description: "Review top waste streams with staff and suppliers to remove avoidable disposables.",
        priority: 1
      },
      {
        organizationId: organization.id,
        category: MetricCategory.RECYCLING,
        title: "Improve diversion signage",
        description: "Place clear recycling signage at every mixed-waste station to increase capture rates.",
        priority: 1
      },
      {
        organizationId: organization.id,
        category: MetricCategory.BUSINESS_TRAVEL,
        title: "Replace short trips with remote meetings",
        description: "Move internal and low-value in-person meetings online to cut avoidable travel.",
        priority: 1
      },
      {
        organizationId: organization.id,
        category: MetricCategory.BUSINESS_TRAVEL,
        title: "Cluster field visits by region",
        description: "Plan sales and supplier visits in batches to reduce duplicate travel distances.",
        priority: 2
      },
      {
        organizationId: organization.id,
        category: MetricCategory.COMMUTING,
        title: "Expand hybrid work days",
        description: "Introduce or extend remote days for roles that do not need daily on-site presence.",
        priority: 1
      },
      {
        organizationId: organization.id,
        category: MetricCategory.COMMUTING,
        title: "Support lower-carbon commuting",
        description: "Offer transit, cycling, or carpool incentives to reduce single-occupancy car travel.",
        priority: 2
      }
    ]
  });

  const metricInputs = [
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

  await Promise.all(
    metricInputs.map(([year, month, electricityKwh, waterM3, wasteKg, recyclingKg, businessTravelKm, commutingKm, notes]) => {
      const emissions = calculateEmissions(
        { electricityKwh, waterM3, wasteKg, recyclingKg, businessTravelKm, commutingKm },
        factorMap
      );

      return prisma.monthlyMetric.create({
        data: {
          organizationId: organization.id,
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
          appliedFactorSnapshot: factorSnapshot
        }
      });
    })
  );
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
