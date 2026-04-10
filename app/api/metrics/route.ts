import { AuditAction, AuditEntityType } from "@prisma/client";
import { NextResponse } from "next/server";

import { refreshAppRoutes } from "@/lib/actions";
import { createAuditLog, toAuditSnapshot } from "@/lib/audit";
import { assertWritableMode } from "@/lib/api-guards";
import { getPrimaryOrganization } from "@/lib/data";
import { normalizeMetricPayload } from "@/lib/csv";
import { calculateEmissions, createFactorMap } from "@/lib/emissions";
import { serializeFactorSnapshot } from "@/lib/factor-versioning";
import { prisma } from "@/lib/prisma";
import { metricInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const organization = await getPrimaryOrganization();
  const metrics = await prisma.monthlyMetric.findMany({
    where: { organizationId: organization.id },
    orderBy: [{ year: "asc" }, { month: "asc" }]
  });

  return NextResponse.json(metrics);
}

export async function POST(request: Request) {
  const readOnlyResponse = assertWritableMode();
  if (readOnlyResponse) {
    return readOnlyResponse;
  }

  try {
    const body = await request.json();
    const payload = normalizeMetricPayload(metricInputSchema.parse(body));
    const organization = await getPrimaryOrganization();
    const metric = await prisma.$transaction(async (tx) => {
      const previousMetric = await tx.monthlyMetric.findUnique({
        where: {
          organizationId_year_month: {
            organizationId: organization.id,
            year: payload.year,
            month: payload.month
          }
        }
      });

      const factors = await tx.emissionFactor.findMany({
        where: { organizationId: organization.id, isCurrent: true }
      });
      const total = calculateEmissions(payload, createFactorMap(factors)).total;
      const appliedFactorSnapshot = serializeFactorSnapshot(factors);

      const savedMetric = await tx.monthlyMetric.upsert({
        where: {
          organizationId_year_month: {
            organizationId: organization.id,
            year: payload.year,
            month: payload.month
          }
        },
        update: {
          ...payload,
          calculatedTotalEmissionsKgCo2e: Number(total.toFixed(3)),
          appliedFactorSnapshot
        },
        create: {
          organizationId: organization.id,
          ...payload,
          calculatedTotalEmissionsKgCo2e: Number(total.toFixed(3)),
          appliedFactorSnapshot
        }
      });

      await createAuditLog(tx, {
        organizationId: organization.id,
        entityType: AuditEntityType.MONTHLY_METRIC,
        entityId: savedMetric.id,
        action: previousMetric ? AuditAction.UPDATE : AuditAction.CREATE,
        snapshotBefore: toAuditSnapshot(previousMetric),
        snapshotAfter: toAuditSnapshot(savedMetric)
      });

      return savedMetric;
    });

    refreshAppRoutes();
    return NextResponse.json(metric);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save metrics." },
      { status: 400 }
    );
  }
}
