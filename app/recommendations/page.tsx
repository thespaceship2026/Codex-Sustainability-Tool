import { Card } from "@/components/card";
import { getDashboardData } from "@/lib/data";
import { buildRecommendations } from "@/lib/emissions";
import { formatMonthFromParts, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const { metrics, factors, recommendationRules } = await getDashboardData();
  const latestMetric = metrics.at(-1) ?? null;
  const recommendations = buildRecommendations(
    latestMetric,
    factors,
    recommendationRules
  );

  return (
    <main className="space-y-6">
      <Card
        title="Priority recommendations"
        description={
          latestMetric
            ? `Suggestions for ${formatMonthFromParts(
                latestMetric.year,
                latestMetric.month
              )} based on the largest current emissions sources.`
            : "Add monthly data to generate recommendations."
        }
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {recommendations.map((item, index) => (
            <div
              key={item.category}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-leaf">
                    Priority {index + 1}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-ink">{item.label}</h2>
                </div>
                <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-ember">
                  {formatNumber(item.impact)} kg CO2e
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                {item.rules.map((rule) => (
                  <div key={rule.id} className="rounded-2xl bg-mist px-4 py-3">
                    <p className="font-medium text-ink">{rule.title}</p>
                    <p className="mt-1">{rule.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card
        title="Rules engine"
        description="Recommendations are generated locally using stored rules and current emissions impact. No external AI service is used."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-mist p-4 text-sm text-slate-700">
            Factors are read from SQLite, then the latest month is scored by category impact.
          </div>
          <div className="rounded-2xl bg-mist p-4 text-sm text-slate-700">
            Categories with the highest emissions get surfaced first.
          </div>
          <div className="rounded-2xl bg-mist p-4 text-sm text-slate-700">
            Stored recommendation rules provide deterministic next-step guidance.
          </div>
        </div>
      </Card>
    </main>
  );
}
