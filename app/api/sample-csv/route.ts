import { sampleMetricsCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(sampleMetricsCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sustainability-template.csv"'
    }
  });
}
