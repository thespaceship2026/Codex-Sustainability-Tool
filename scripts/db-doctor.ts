import { PrismaClient } from "@prisma/client";

import { categoryOrder } from "../lib/constants";

const prisma = new PrismaClient();

async function main() {
  const issues: string[] = [];
  const [orgCount, currentFactors, allFactors, metrics, latestAuditLog] = await Promise.all([
    prisma.organization.count(),
    prisma.emissionFactor.findMany({ where: { isCurrent: true } }),
    prisma.emissionFactor.findMany(),
    prisma.monthlyMetric.findMany({
      select: { year: true, month: true, appliedFactorSnapshot: true }
    }),
    prisma.auditLog.findFirst({ orderBy: { createdAt: "desc" } })
  ]);

  if (orgCount === 0) {
    issues.push("No organization found. Run npm run db:reset.");
  }

  for (const category of categoryOrder) {
    const currentCount = currentFactors.filter((factor) => factor.category === category).length;
    if (currentCount === 0) {
      issues.push(`Missing current factor for ${category}.`);
    }
    if (currentCount > 1) {
      issues.push(`Multiple current factors found for ${category}.`);
    }
  }

  const snapshotlessMetrics = metrics.filter((metric) => metric.appliedFactorSnapshot === null);
  if (snapshotlessMetrics.length > 0) {
    issues.push(`${snapshotlessMetrics.length} metric(s) are missing factor snapshots.`);
  }

  const duplicates = metrics.reduce<Record<string, number>>((acc, metric) => {
    const key = `${metric.year}-${metric.month}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const duplicatePeriods = Object.entries(duplicates).filter(([, count]) => count > 1);
  if (duplicatePeriods.length > 0) {
    issues.push(`Duplicate monthly periods detected: ${duplicatePeriods.map(([key]) => key).join(", ")}.`);
  }

  console.log(
    JSON.stringify(
      {
        organizations: orgCount,
        metrics: metrics.length,
        factors: allFactors.length,
        currentFactors: currentFactors.length,
        latestAuditLogAt: latestAuditLog?.createdAt ?? null,
        issues
      },
      null,
      2
    )
  );

  if (issues.length > 0) {
    process.exit(1);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
