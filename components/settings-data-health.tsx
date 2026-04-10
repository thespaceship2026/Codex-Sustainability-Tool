type DataHealthProps = {
  trackedMonths: number;
  missingCurrentFactors: string[];
  duplicateCurrentFactorCategories: string[];
  metricsMissingSnapshots: Array<{ year: number; month: number }>;
};

export function SettingsDataHealth({
  trackedMonths,
  missingCurrentFactors,
  duplicateCurrentFactorCategories,
  metricsMissingSnapshots
}: DataHealthProps) {
  const issues = [
    ...missingCurrentFactors.map((category) => `Missing current factor for ${category}.`),
    ...duplicateCurrentFactorCategories.map(
      (category) => `More than one current factor is marked for ${category}.`
    ),
    ...metricsMissingSnapshots.map(
      (metric) => `Metric ${metric.year}-${String(metric.month).padStart(2, "0")} has no factor snapshot.`
    )
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-mist p-4">
          <p className="text-sm text-slate-500">Tracked months</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{trackedMonths}</p>
        </div>
        <div className="rounded-2xl bg-mist p-4">
          <p className="text-sm text-slate-500">Missing current factors</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{missingCurrentFactors.length}</p>
        </div>
        <div className="rounded-2xl bg-mist p-4">
          <p className="text-sm text-slate-500">Duplicate current factors</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {duplicateCurrentFactorCategories.length}
          </p>
        </div>
        <div className="rounded-2xl bg-mist p-4">
          <p className="text-sm text-slate-500">Missing factor snapshots</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {metricsMissingSnapshots.length}
          </p>
        </div>
      </div>
      <div
        className={`rounded-2xl p-4 text-sm ${
          issues.length === 0
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-800"
        }`}
      >
        {issues.length === 0 ? (
          <p>Data health looks good. No integrity warnings were detected.</p>
        ) : (
          <div className="space-y-2">
            {issues.map((issue) => (
              <p key={issue}>{issue}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
