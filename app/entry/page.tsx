import { Card } from "@/components/card";
import { MetricDetailPanel } from "@/components/metric-detail-panel";
import { MonthlyEntryForm } from "@/components/monthly-entry-form";
import { metricToEditableForm } from "@/lib/csv";
import { getDashboardData, getLatestMetric } from "@/lib/data";
import { formatMonthFromParts, toPeriodKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EntryPage({
  searchParams
}: {
  searchParams?: { period?: string };
}) {
  const latestMetric = await getLatestMetric();
  const { metrics } = await getDashboardData();
  const selectedMetric =
    metrics.find((metric) => toPeriodKey(metric.year, metric.month) === searchParams?.period) ??
    latestMetric ??
    undefined;

  return (
    <main className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card
        title="Monthly data entry"
        description="Create a monthly record or select an existing one to edit and resave."
      >
        <MonthlyEntryForm initialData={metricToEditableForm(selectedMetric)} />
      </Card>
      <Card
        title="Edit existing entries"
        description="Pick a reporting month to load it into the form."
      >
        <div className="space-y-5">
          <div className="space-y-3">
            {metrics
              .slice()
              .reverse()
              .map((metric) => (
                <a
                  key={toPeriodKey(metric.year, metric.month)}
                  href={`/entry?period=${toPeriodKey(metric.year, metric.month)}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-mist px-4 py-3 text-sm hover:bg-white"
                >
                  <span className="font-medium text-ink">
                    {formatMonthFromParts(metric.year, metric.month)}
                  </span>
                  <span className="text-slate-600">
                    {metric.calculatedTotalEmissionsKgCo2e.toFixed(1)} kg CO2e
                  </span>
                </a>
              ))}
          </div>

          {selectedMetric ? <MetricDetailPanel metric={selectedMetric} /> : null}
        </div>
      </Card>
    </main>
  );
}
