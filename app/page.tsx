import { Card } from "@/components/card";
import { HorizontalBarChart, TrendChart } from "@/components/charts";
import { DataTable } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import {
  buildLatestBreakdown,
  buildRecommendations,
  buildTrend,
  calculateStoredMetricEmissions,
  createFactorMap
} from "@/lib/emissions";
import { getDashboardData } from "@/lib/data";
import { formatMonthFromParts, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { metrics, factors, goals, recommendationRules } = await getDashboardData();
  const latestMetric = metrics.at(-1) ?? null;
  const previousMetric = metrics.at(-2) ?? null;
  const factorMap = createFactorMap(factors);
  const trend = buildTrend(metrics);
  const latestEmissions = latestMetric
    ? calculateStoredMetricEmissions(latestMetric, factorMap)
    : { total: 0, byCategory: {} };
  const previousTotal = previousMetric
    ? calculateStoredMetricEmissions(previousMetric, factorMap).total
    : 0;
  const breakdown = buildLatestBreakdown(latestMetric, factors, goals);
  const topRecommendation = buildRecommendations(
    latestMetric,
    factors,
    recommendationRules
  )[0];
  const tableRows = metrics.map((metric) => ({
    ...metric,
    totalEmissions: metric.calculatedTotalEmissionsKgCo2e
  }));
  const change = latestEmissions.total - previousTotal;

  return (
    <main className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Latest total emissions"
          value={`${formatNumber(latestEmissions.total)} kg CO2e`}
          helper={
            latestMetric
              ? `Recorded for ${formatMonthFromParts(
                  latestMetric.year,
                  latestMetric.month
                )}`
              : "Add your first monthly entry to populate the dashboard."
          }
        />
        <KpiCard
          label="Trend vs previous month"
          value={`${change >= 0 ? "+" : ""}${formatNumber(change)} kg CO2e`}
          helper="Latest month compared with the prior reporting month."
        />
        <KpiCard
          label="Recycling diversion"
          value={
            latestMetric && latestMetric.wasteKg > 0
              ? `${formatNumber(
                  (latestMetric.recyclingKg /
                    (latestMetric.recyclingKg + latestMetric.wasteKg)) *
                    100
                )}%`
              : "0.0%"
          }
          helper="Share of material diverted into recycling."
        />
        <KpiCard
          label="Tracked months"
          value={String(metrics.length)}
          helper="Seeded demo data is ready for local exploration."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card
          title="Emissions over time"
          description="Monthly total emissions based on the factors stored in your local database."
        >
          <TrendChart data={trend} />
        </Card>
        <Card
          title="Emissions by category"
          description="Latest month category impact, including recycling as an avoided-emissions credit."
        >
          <HorizontalBarChart
            data={breakdown.map((item) => ({
              label: item.label,
              value: item.emissions,
              tone: item.emissions < 0 ? "positive" : "negative"
            }))}
          />
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card
          title="Recent performance summary"
          description="See actuals, emissions, and goal status in one place."
        >
          <div className="space-y-3">
            {breakdown.map((item) => {
              const onTrack =
                item.target === undefined
                  ? true
                  : item.category === "RECYCLING"
                    ? item.actual >= item.target
                    : item.actual <= item.target;

              return (
                <div
                  key={item.category}
                  className="rounded-2xl border border-slate-100 bg-mist px-4 py-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink">{item.label}</p>
                      <p className="text-sm text-slate-600">
                        Actual {formatNumber(item.actual)} {item.unit}
                      </p>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>{formatNumber(item.emissions)} kg CO2e impact</p>
                      {item.target !== undefined ? (
                        <p>
                          Goal {formatNumber(item.target)} {item.unit} by{" "}
                          {item.targetMonth}/{item.targetYear} ·{" "}
                          <span className={onTrack ? "text-emerald-700" : "text-amber-700"}>
                            {onTrack ? "On track" : "Off track"}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card
          title="Top recommendation"
          description="Highest-priority rule based on the biggest current source."
        >
          {topRecommendation ? (
            <div className="rounded-3xl bg-sand p-5">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-ember">
                {topRecommendation.label}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-ink">
                {topRecommendation.rules[0]?.title ?? "Review this category"}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {topRecommendation.rules[0]?.description ??
                  "This category is one of the largest drivers of your current footprint."}
              </p>
              <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                <p className="font-semibold text-ink">
                  {formatNumber(topRecommendation.impact)} kg CO2e
                </p>
                <p>Latest category impact</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Add monthly data to unlock recommendations.
            </p>
          )}
        </Card>
      </section>

      <Card
        title="Recent metrics"
        description="Founders can review the full reporting history behind the dashboard."
      >
        <DataTable rows={tableRows} />
      </Card>
    </main>
  );
}
