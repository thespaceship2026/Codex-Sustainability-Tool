import { formatNumber } from "@/lib/utils";

type TrendChartPoint = {
  label: string;
  totalEmissions: number;
};

type TrendChartProps = {
  data: TrendChartPoint[];
};

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) {
    return <EmptyChart message="No monthly metrics yet." />;
  }

  const width = 640;
  const height = 240;
  const padding = 24;
  const maxValue = Math.max(...data.map((point) => point.totalEmissions), 1);

  const points = data
    .map((point, index) => {
      const x =
        padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
      const y =
        height - padding - (point.totalEmissions / maxValue) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="space-y-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-60 w-full rounded-2xl bg-mist/80"
        role="img"
        aria-label="Monthly emissions trend"
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3f8f77" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#3f8f77" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((step) => {
          const y = padding + ((height - padding * 2) / 3) * step;
          return (
            <line
              key={step}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="rgba(36, 92, 79, 0.15)"
              strokeDasharray="5 5"
            />
          );
        })}
        <polyline fill="none" stroke="#3f8f77" strokeWidth="4" points={points} />
        {data.map((point, index) => {
          const x =
            padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
          const y =
            height - padding - (point.totalEmissions / maxValue) * (height - padding * 2);
          return <circle key={point.label} cx={x} cy={y} r="5" fill="#245c4f" />;
        })}
      </svg>
      <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-3 lg:grid-cols-6">
        {data.map((point) => (
          <div key={point.label} className="rounded-2xl bg-mist px-3 py-2">
            <p className="font-medium text-ink">{point.label}</p>
            <p>{formatNumber(point.totalEmissions)} kg CO2e</p>
          </div>
        ))}
      </div>
    </div>
  );
}

type BarDatum = {
  label: string;
  value: number;
  tone?: "positive" | "negative";
};

export function HorizontalBarChart({ data }: { data: BarDatum[] }) {
  if (data.length === 0) {
    return <EmptyChart message="No chart data yet." />;
  }

  const maxValue = Math.max(...data.map((item) => Math.abs(item.value)), 1);

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const width = `${(Math.abs(item.value) / maxValue) * 100}%`;
        const barColor =
          item.tone === "positive" ? "bg-emerald-500" : "bg-moss";

        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink">{item.label}</span>
              <span className="text-slate-600">{formatNumber(item.value)} kg CO2e</span>
            </div>
            <div className="h-3 rounded-full bg-mist">
              <div className={`h-3 rounded-full ${barColor}`} style={{ width }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-52 items-center justify-center rounded-2xl border border-dashed border-moss/20 bg-mist text-sm text-slate-500">
      {message}
    </div>
  );
}
