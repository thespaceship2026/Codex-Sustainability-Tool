"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EmissionFactor } from "@prisma/client";

import { categoryMeta, categoryOrder, type CategoryKey } from "@/lib/constants";
import { getReadOnlyDemoMessage, isReadOnlyDemoMode } from "@/lib/runtime";

export function FactorsForm({ factors }: { factors: EmissionFactor[] }) {
  const router = useRouter();
  const isReadOnlyDemo = isReadOnlyDemoMode();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const factorMap = Object.fromEntries(factors.map((factor) => [factor.category, factor]));

  async function onSubmit(formData: FormData) {
    if (isReadOnlyDemo) {
      setStatus(getReadOnlyDemoMessage());
      return;
    }

    const payload = categoryOrder.map((category) => ({
      category,
      factor: Number(formData.get(`${category}-factor`)),
      label: String(formData.get(`${category}-label`) ?? ""),
      unit: String(formData.get(`${category}-unit`) ?? ""),
      description: String(formData.get(`${category}-description`) ?? "")
    }));

    startTransition(async () => {
      const response = await fetch("/api/factors", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        setStatus("Unable to update factors.");
        return;
      }

      setStatus("Factors updated.");
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {categoryOrder.map((category) => {
          const factor = factorMap[category];
          const meta = categoryMeta[category as CategoryKey];

          return (
            <div key={category} className="rounded-2xl border border-slate-200 bg-mist p-4">
              <p className="font-semibold text-ink">{meta.label}</p>
              {factor ? (
                <p className="mt-1 text-xs text-slate-500">
                  Current version {factor.version} · effective{" "}
                  {new Date(factor.effectiveDate).toLocaleDateString("en-US")}
                </p>
              ) : null}
              <div className="mt-3 grid gap-3">
                <input
                  name={`${category}-label`}
                  defaultValue={factor?.label ?? meta.label}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  placeholder="Factor label"
                  disabled={isReadOnlyDemo}
                />
                <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                  <input
                    name={`${category}-unit`}
                    defaultValue={factor?.unit ?? meta.factorUnit}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    placeholder="Unit"
                    disabled={isReadOnlyDemo}
                  />
                  <input
                    name={`${category}-factor`}
                    type="number"
                    step="0.0001"
                    min="0"
                    defaultValue={factor?.factor ?? 0}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    placeholder="Factor"
                    disabled={isReadOnlyDemo}
                  />
                </div>
                <textarea
                  name={`${category}-description`}
                  rows={3}
                  defaultValue={factor?.description ?? ""}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  placeholder="Description"
                  disabled={isReadOnlyDemo}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending || isReadOnlyDemo}
          className="rounded-full bg-moss px-5 py-3 text-sm font-semibold text-white hover:bg-leaf disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isReadOnlyDemo ? "Read-only demo" : isPending ? "Saving..." : "Save factors"}
        </button>
        {status ? <p className="text-sm text-slate-600">{status}</p> : null}
      </div>
    </form>
  );
}
