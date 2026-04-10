import type { EmissionFactor } from "@prisma/client";

import { categoryMeta } from "@/lib/constants";

export function FactorHistory({ factors }: { factors: EmissionFactor[] }) {
  const byCategory = factors.reduce<Record<string, EmissionFactor[]>>((acc, factor) => {
    acc[factor.category] ??= [];
    acc[factor.category].push(factor);
    return acc;
  }, {});

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Object.entries(byCategory).map(([category, categoryFactors]) => (
        <div key={category} className="rounded-2xl border border-slate-200 bg-mist p-4">
          <h3 className="font-semibold text-ink">
            {categoryMeta[category as keyof typeof categoryMeta].label}
          </h3>
          <div className="mt-3 space-y-2 text-sm">
            {categoryFactors.map((factor) => (
              <div
                key={factor.id}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">
                    v{factor.version} · {factor.factor} {factor.unit}
                  </p>
                  <p className="text-slate-500">
                    Effective {new Date(factor.effectiveDate).toLocaleDateString("en-US")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    factor.isCurrent
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {factor.isCurrent ? "Current" : "Archived"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
