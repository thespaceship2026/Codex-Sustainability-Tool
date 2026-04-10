"use client";

import { useState } from "react";
import type { MonthlyMetric } from "@prisma/client";

import { categoryMeta, categoryOrder } from "@/lib/constants";
import { parseFactorSnapshot } from "@/lib/factor-versioning";
import { formatMonthFromParts, formatNumber } from "@/lib/utils";

export function MetricDetailPanel({ metric }: { metric: MonthlyMetric }) {
  const factorSnapshot = parseFactorSnapshot(metric.appliedFactorSnapshot);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [copiedFactorId, setCopiedFactorId] = useState<string | null>(null);

  async function copyFactorId(factorId: string) {
    try {
      await navigator.clipboard.writeText(factorId);
      setCopiedFactorId(factorId);
      window.setTimeout(() => {
        setCopiedFactorId((current) => (current === factorId ? null : current));
      }, 1500);
    } catch {
      setCopiedFactorId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-mist p-4">
        <p className="text-sm text-slate-500">Selected month</p>
        <p className="mt-2 text-xl font-semibold text-ink">
          {formatMonthFromParts(metric.year, metric.month)}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Stored total: {formatNumber(metric.calculatedTotalEmissionsKgCo2e)} kg CO2e
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-ink">Factor snapshot used for this month</h3>
        <p className="mt-1 text-sm text-slate-500">
          This shows the exact factor version captured when this record was saved.
        </p>

        {factorSnapshot ? (
          <div className="mt-4 space-y-3">
            {categoryOrder.map((category) => {
              const item = factorSnapshot[category];
              const meta = categoryMeta[category];
              const isOpen = openCategory === category;

              return (
                <div key={category} className="rounded-2xl bg-mist px-4 py-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setOpenCategory(isOpen ? null : category)}
                    className="flex w-full flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-ink">{meta.label}</p>
                      <p className="text-slate-500">
                        v{item.version} · effective{" "}
                        {new Date(item.effectiveDate).toLocaleDateString("en-US")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <span>
                        {formatNumber(item.factor, 3)} {item.unit}
                      </span>
                      <span className="text-xs font-semibold text-moss">
                        {isOpen ? "Hide details" : "Show details"}
                      </span>
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
                      <p>
                        <span className="font-semibold text-ink">Factor label:</span> {item.label}
                      </p>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="break-all">
                          <span className="font-semibold text-ink">Factor ID:</span> {item.factorId}
                        </p>
                        <button
                          type="button"
                          onClick={() => copyFactorId(item.factorId)}
                          className="rounded-full border border-moss/20 bg-mist px-3 py-1 text-xs font-semibold text-moss hover:border-moss/40 hover:bg-white"
                        >
                          {copiedFactorId === item.factorId ? "Copied" : "Copy ID"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
            No factor snapshot is stored for this month yet.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-ink">Monthly note</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {metric.notes?.trim() || "No note saved for this month."}
        </p>
      </div>
    </div>
  );
}
