import type { EmissionFactor, Prisma } from "@prisma/client";

import { categoryOrder, type CategoryKey } from "@/lib/constants";

export type StoredFactor = Pick<
  EmissionFactor,
  "id" | "category" | "label" | "unit" | "factor" | "version" | "effectiveDate"
>;

export type FactorSnapshot = Record<
  CategoryKey,
  {
    factorId: string;
    label: string;
    unit: string;
    factor: number;
    version: number;
    effectiveDate: string;
  }
>;

export function serializeFactorSnapshot(factors: StoredFactor[]) {
  return factors.reduce((snapshot, factor) => {
    snapshot[factor.category as CategoryKey] = {
      factorId: factor.id,
      label: factor.label,
      unit: factor.unit,
      factor: factor.factor,
      version: factor.version,
      effectiveDate: factor.effectiveDate.toISOString()
    };
    return snapshot;
  }, {} as FactorSnapshot) satisfies Prisma.JsonObject;
}

export function parseFactorSnapshot(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const snapshot = value as Partial<FactorSnapshot>;

  if (!categoryOrder.every((category) => snapshot[category])) {
    return null;
  }

  return snapshot as FactorSnapshot;
}
