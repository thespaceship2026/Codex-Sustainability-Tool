import { Card } from "@/components/card";
import { GoalsForm } from "@/components/goals-form";
import { getDashboardData } from "@/lib/data";
import { buildLatestBreakdown } from "@/lib/emissions";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const { metrics, factors, goals } = await getDashboardData();
  const latestMetric = metrics.at(-1) ?? null;
  const breakdown = buildLatestBreakdown(latestMetric, factors, goals);

  return (
    <main className="space-y-6">
      <Card
        title="Targets vs actuals"
        description="Set category goals and immediately see whether the latest month is on track."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {breakdown.map((item) => {
            const progress =
              item.target && item.target > 0
                ? Math.min((item.actual / item.target) * 100, 160)
                : 0;
            const onTrack =
              item.target === undefined
                ? true
                : item.category === "RECYCLING"
                  ? item.actual >= item.target
                  : item.actual <= item.target;

            return (
              <div key={item.category} className="rounded-2xl border border-slate-200 bg-mist p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatNumber(item.actual)} / {formatNumber(item.target ?? 0)} {item.unit}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      onTrack
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {onTrack ? "On track" : "Off track"}
                  </span>
                </div>
                <div className="mt-4 h-3 rounded-full bg-white">
                  <div
                    className={`h-3 rounded-full ${
                      onTrack ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Goal deadline:{" "}
                  {item.targetMonth && item.targetYear
                    ? `${item.targetMonth}/${item.targetYear}`
                    : "Not set"}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
      <Card
        title="Edit goals"
        description="Goals are stored locally and reused across dashboard summaries and recommendations."
      >
        <GoalsForm goals={goals} />
      </Card>
    </main>
  );
}
