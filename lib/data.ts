import { prisma } from "@/lib/prisma";
import { categoryOrder } from "@/lib/constants";
import { getDemoDataset } from "@/lib/demo-data";
import { isReadOnlyDemoMode } from "@/lib/runtime";

async function withDemoFallback<T>(loader: () => Promise<T>, fallback: () => T | Promise<T>) {
  try {
    return await loader();
  } catch (error) {
    if (!isReadOnlyDemoMode()) {
      throw error;
    }

    return fallback();
  }
}

export async function getPrimaryOrganization() {
  const organization = await withDemoFallback(
    () =>
      prisma.organization.findFirst({
        orderBy: {
          createdAt: "asc"
        }
      }),
    () => getDemoDataset().organization
  );

  if (!organization) {
    throw new Error("No organization found. Run the seed command first.");
  }

  return organization;
}

export async function getDashboardData() {
  return withDemoFallback(
    async () => {
      const organization = await getPrimaryOrganization();
      const [metrics, factors, goals, recommendationRules] = await Promise.all([
        prisma.monthlyMetric.findMany({
          where: { organizationId: organization.id },
          orderBy: [{ year: "asc" }, { month: "asc" }]
        }),
        prisma.emissionFactor.findMany({
          where: { organizationId: organization.id, isCurrent: true },
          orderBy: [{ category: "asc" }, { version: "desc" }]
        }),
        prisma.sustainabilityGoal.findMany({
          where: { organizationId: organization.id },
          orderBy: {
            category: "asc"
          }
        }),
        prisma.recommendationRule.findMany({
          where: { organizationId: organization.id, isActive: true },
          orderBy: [{ category: "asc" }, { priority: "asc" }]
        })
      ]);

      return { organization, metrics, factors, goals, recommendationRules };
    },
    () => {
      const demo = getDemoDataset();
      return {
        organization: demo.organization,
        metrics: demo.metrics,
        factors: demo.factors,
        goals: demo.goals,
        recommendationRules: demo.recommendationRules
      };
    }
  );
}

export async function getLatestMetric() {
  return withDemoFallback(
    async () => {
      const organization = await getPrimaryOrganization();

      return prisma.monthlyMetric.findFirst({
        where: { organizationId: organization.id },
        orderBy: [{ year: "desc" }, { month: "desc" }]
      });
    },
    () => getDemoDataset().metrics.at(-1) ?? null
  );
}

export async function getCurrentFactors(organizationId: string) {
  return withDemoFallback(
    () =>
      prisma.emissionFactor.findMany({
        where: {
          organizationId,
          isCurrent: true
        },
        orderBy: [{ category: "asc" }, { version: "desc" }]
      }),
    () => getDemoDataset().currentFactors
  );
}

export async function getSettingsData() {
  return withDemoFallback(
    async () => {
      const organization = await getPrimaryOrganization();
      const [currentFactors, factorHistory, latestAuditLogs, metrics] = await Promise.all([
        prisma.emissionFactor.findMany({
          where: { organizationId: organization.id, isCurrent: true },
          orderBy: [{ category: "asc" }, { version: "desc" }]
        }),
        prisma.emissionFactor.findMany({
          where: { organizationId: organization.id },
          orderBy: [{ category: "asc" }, { version: "desc" }]
        }),
        prisma.auditLog.findMany({
          where: { organizationId: organization.id },
          orderBy: { createdAt: "desc" },
          take: 25
        }),
        prisma.monthlyMetric.findMany({
          where: { organizationId: organization.id },
          select: {
            year: true,
            month: true,
            appliedFactorSnapshot: true
          }
        })
      ]);

      const currentFactorCounts = factorHistory.reduce<Record<string, number>>((acc, factor) => {
        if (factor.isCurrent) {
          acc[factor.category] = (acc[factor.category] ?? 0) + 1;
        }
        return acc;
      }, {});

      const missingCurrentFactors = categoryOrder.filter(
        (category) => !currentFactors.some((factor) => factor.category === category)
      );

      const duplicateCurrentFactorCategories = categoryOrder.filter(
        (category) => (currentFactorCounts[category] ?? 0) > 1
      );

      const metricsMissingSnapshots = metrics.filter(
        (metric) => metric.appliedFactorSnapshot === null
      );

      return {
        organization,
        currentFactors,
        factorHistory,
        latestAuditLogs,
        dataHealth: {
          missingCurrentFactors,
          duplicateCurrentFactorCategories,
          metricsMissingSnapshots,
          trackedMonths: metrics.length
        }
      };
    },
    () => {
      const demo = getDemoDataset();
      return {
        organization: demo.organization,
        currentFactors: demo.currentFactors,
        factorHistory: demo.factorHistory,
        latestAuditLogs: demo.latestAuditLogs,
        dataHealth: demo.dataHealth
      };
    }
  );
}
