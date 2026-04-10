"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { getReadOnlyDemoMessage, isReadOnlyDemoMode } from "@/lib/runtime";
import type { MetricInput } from "@/lib/types";

const numericFields = [
  ["electricityKwh", "Electricity usage (kWh)"],
  ["waterM3", "Water usage (m3)"],
  ["wasteKg", "Waste generated (kg)"],
  ["recyclingKg", "Recycling amount (kg)"],
  ["businessTravelKm", "Business travel distance (km)"],
  ["commutingKm", "Employee commuting distance (km)"]
] as const;

type MonthlyEntryFormProps = {
  initialData: MetricInput;
};

export function MonthlyEntryForm({ initialData }: MonthlyEntryFormProps) {
  const router = useRouter();
  const isReadOnlyDemo = isReadOnlyDemoMode();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    if (isReadOnlyDemo) {
      setError(getReadOnlyDemoMessage());
      setMessage(null);
      return;
    }

    setError(null);
    setMessage(null);

    const payload = Object.fromEntries(formData.entries());

    startTransition(async () => {
      const response = await fetch("/api/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Unable to save monthly metrics.");
        return;
      }

      setMessage("Monthly metrics saved.");
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium text-ink">Year</span>
          <input
            name="year"
            type="number"
            min="2020"
            max="2100"
            defaultValue={initialData.year}
            className="w-full rounded-2xl border border-slate-200 bg-mist px-4 py-3"
            required
            disabled={isReadOnlyDemo}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-ink">Month</span>
          <input
            name="month"
            type="number"
            min="1"
            max="12"
            defaultValue={initialData.month}
            className="w-full rounded-2xl border border-slate-200 bg-mist px-4 py-3"
            required
            disabled={isReadOnlyDemo}
          />
        </label>
        {numericFields.map(([name, label]) => (
          <label key={name} className="space-y-2">
            <span className="text-sm font-medium text-ink">{label}</span>
            <input
              name={name}
              type="number"
              min="0"
              step="0.01"
              defaultValue={initialData[name]}
              className="w-full rounded-2xl border border-slate-200 bg-mist px-4 py-3"
              required
              disabled={isReadOnlyDemo}
            />
          </label>
        ))}
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-ink">Notes</span>
        <textarea
          name="notes"
          rows={4}
          defaultValue={initialData.notes ?? ""}
          className="w-full rounded-2xl border border-slate-200 bg-mist px-4 py-3"
          placeholder="Optional monthly context or actions taken"
          disabled={isReadOnlyDemo}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending || isReadOnlyDemo}
          className="rounded-full bg-moss px-5 py-3 text-sm font-semibold text-white hover:bg-leaf disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isReadOnlyDemo ? "Read-only demo" : isPending ? "Saving..." : "Save monthly metrics"}
        </button>
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
    </form>
  );
}
