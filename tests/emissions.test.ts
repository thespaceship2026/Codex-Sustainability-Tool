import test from "node:test";
import assert from "node:assert/strict";
import type { EmissionFactor, MetricCategory } from "@prisma/client";

import { calculateEmissions, createFactorMap } from "../lib/emissions";

function makeFactor(
  category: MetricCategory,
  factor: number,
  unit: string
): EmissionFactor {
  const now = new Date();

  return {
    id: `${category}-factor`,
    organizationId: "org-demo",
    category,
    label: `${category} factor`,
    unit,
    factor,
    description: null,
    createdAt: now,
    updatedAt: now
  };
}

test("calculateEmissions applies all category formulas and subtracts recycling", () => {
  const factors = createFactorMap([
    makeFactor("ELECTRICITY", 0.2, "kg CO2e / kWh"),
    makeFactor("WATER", 0.3, "kg CO2e / m3"),
    makeFactor("WASTE", 0.4, "kg CO2e / kg"),
    makeFactor("RECYCLING", 0.1, "kg CO2e avoided / kg"),
    makeFactor("BUSINESS_TRAVEL", 0.5, "kg CO2e / km"),
    makeFactor("COMMUTING", 0.25, "kg CO2e / km")
  ]);

  const result = calculateEmissions(
    {
      electricityKwh: 100,
      waterM3: 10,
      wasteKg: 5,
      recyclingKg: 8,
      businessTravelKm: 20,
      commutingKm: 40
    },
    factors
  );

  assert.equal(result.byCategory.ELECTRICITY, 20);
  assert.equal(result.byCategory.WATER, 3);
  assert.equal(result.byCategory.WASTE, 2);
  assert.equal(result.byCategory.RECYCLING, -0.8);
  assert.equal(result.byCategory.BUSINESS_TRAVEL, 10);
  assert.equal(result.byCategory.COMMUTING, 10);
  assert.equal(result.total, 44.2);
});

test("calculateEmissions returns zero when all activity values are zero", () => {
  const factors = createFactorMap([
    makeFactor("ELECTRICITY", 0.233, "kg CO2e / kWh"),
    makeFactor("WATER", 0.344, "kg CO2e / m3"),
    makeFactor("WASTE", 0.587, "kg CO2e / kg"),
    makeFactor("RECYCLING", 0.221, "kg CO2e avoided / kg"),
    makeFactor("BUSINESS_TRAVEL", 0.171, "kg CO2e / km"),
    makeFactor("COMMUTING", 0.121, "kg CO2e / km")
  ]);

  const result = calculateEmissions(
    {
      electricityKwh: 0,
      waterM3: 0,
      wasteKg: 0,
      recyclingKg: 0,
      businessTravelKm: 0,
      commutingKm: 0
    },
    factors
  );

  assert.equal(result.total, 0);
});
