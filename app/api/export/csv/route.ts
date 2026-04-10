import { getPrimaryOrganization } from "@/lib/data";
import { metricsToCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const organization = await getPrimaryOrganization();
  const metrics = await prisma.monthlyMetric.findMany({
    where: { organizationId: organization.id },
    orderBy: [{ year: "asc" }, { month: "asc" }]
  });

  const csv = metricsToCsv(metrics);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sustainability-metrics.csv"'
    }
  });
}
