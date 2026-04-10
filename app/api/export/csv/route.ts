import { getDashboardData } from "@/lib/data";
import { metricsToCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const { metrics } = await getDashboardData();

  const csv = metricsToCsv(metrics);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sustainability-metrics.csv"'
    }
  });
}
