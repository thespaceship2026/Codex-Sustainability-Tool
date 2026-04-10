"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SustainabilityGoal } from "@prisma/client";

import { categoryMeta, categoryOrder, type CategoryKey } from "@/lib/constants";
import { getReadOnlyDemoMessage, isReadOnlyDemoMode } from "@/lib/runtime";

export function GoalsForm({ goals }: { goals: SustainabilityGoal[] }) {
  const router = useRouter();
  const isReadOnlyDemo = isReadOnlyDemoMode();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const goalMap = Object.fromEntries(goals.map((goal) => [goal.category, goal]));

  async function onSubmit(formData: FormData) {
    if (isReadOnlyDemo) {
      setStatus(getReadOnlyDemoMessage());
      return;
    }

    const payload = categoryOrder.map((category) => ({
      category,
      label: String(formData.get(`${category}-label`) ?? ""),
      unit: String(formData.get(`${category}-unit`) ?? ""),
      targetValue: Number(formData.get(`${category}-targetValue`)),
      targetMonth: Number(formData.get(`${category}-targetMonth`)),
      targetYear: Number(formData.get(`${category}-targetYear`))
    }));

    startTransition(async () => {
      const response = await fetch("/api/goals", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        setStatus("Unable to update goals.");
        return;
      }

      setStatus("Goals updated.");
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {categoryOrder.map((category) => {
          const goal = goalMap[category];
          const meta = categoryMeta[category as CategoryKey];

          return (
            <div key={category} className="rounded-2xl border border-slate-200 bg-mist p-4">
              <p className="font-semibold text-ink">{meta.label}</p>
              <div className="mt-3 grid gap-3">
                <input
                  name={`${category}-label`}
                  defaultValue={goal?.label ?? `Improve ${meta.label.toLowerCase()}`}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  placeholder="Goal label"
                  disabled={isReadOnlyDemo}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    name={`${category}-targetValue`}
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={goal?.targetValue ?? 0}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    placeholder="Target value"
                    disabled={isReadOnlyDemo}
                  />
                  <input
                    name={`${category}-targetMonth`}
                    type="number"
                    min="1"
                    max="12"
                    defaultValue={goal?.targetMonth ?? 12}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    disabled={isReadOnlyDemo}
                  />
                  <input
                    name={`${category}-targetYear`}
                    type="number"
                    min="2020"
                    max="2100"
                    defaultValue={goal?.targetYear ?? 2026}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    disabled={isReadOnlyDemo}
                  />
                </div>
                <input
                  name={`${category}-unit`}
                  defaultValue={goal?.unit ?? meta.unit}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  placeholder="Unit"
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
          {isReadOnlyDemo ? "Read-only demo" : isPending ? "Saving..." : "Save goals"}
        </button>
        {status ? <p className="text-sm text-slate-600">{status}</p> : null}
      </div>
    </form>
  );
}
