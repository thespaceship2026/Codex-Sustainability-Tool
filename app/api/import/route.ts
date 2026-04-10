import { NextResponse } from "next/server";

import { refreshAppRoutes } from "@/lib/actions";
import { assertWritableMode } from "@/lib/api-guards";
import { createAuditLog, toAuditSnapshot } from "@/lib/audit";
import { getPrimaryOrganization } from "@/lib/data";
import { parseMetricsCsv } from "@/lib/csv";
import { calculateEmissions, createFactorMap } from "@/lib/emissions";
import { serializeFactorSnapshot } from "@/lib/factor-versioning";
import { prisma } from "@/lib/prisma";
import { AuditAction, AuditEntityType } from "@prisma/client";
import { csvImportRequestSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const readOnlyResponse = assertWritableMode();
  if (readOnlyResponse) {
    return readOnlyResponse;
  }

  try {
    const body = csvImportRequestSchema.parse(await request.json());
    const { validRows, invalidRows } = parseMetricsCsv(body.csv);
    const organization = await getPrimaryOrganization();
    const existingMetrics = await prisma.monthlyMetric.findMany({
      where: { organizationId: organization.id },
      select: { year: true, month: true }
    });
    const factors = await prisma.emissionFactor.findMany({
      where: { organizationId: organization.id, isCurrent: true }
    });
    const factorMap = createFactorMap(factors);
    const factorSnapshot = serializeFactorSnapshot(factors);
    const existingPeriods = new Set(existingMetrics.map((row) => `${row.year}-${row.month}`));
    const seenPeriods = new Set<string>();
    const duplicateRows: Array<{ rowNumber: number; reason: string }> = [];

    validRows.forEach((row, index) => {
      const key = `${row.year}-${row.month}`;
      if (seenPeriods.has(key)) {
        duplicateRows.push({
          rowNumber: index + 2,
          reason: "Duplicate month/year in this import batch."
        });
      }
      seenPeriods.add(key);
    });

    const rowsToApply = validRows.filter((row, index) => {
      const rowNumber = index + 2;
      return !duplicateRows.some((duplicate) => duplicate.rowNumber === rowNumber);
    });

    const overwritingRows = rowsToApply.filter((row) =>
      existingPeriods.has(`${row.year}-${row.month}`)
    );
    const creatingRows = rowsToApply.length - overwritingRows.length;

    if (body.preview) {
      return NextResponse.json({
        ok: true,
        preview: true,
        creatingCount: creatingRows,
        overwritingCount: overwritingRows.length,
        validCount: rowsToApply.length,
        invalidCount: invalidRows.length + duplicateRows.length,
        invalidRows: [...invalidRows, ...duplicateRows]
      });
    }

    await prisma.$transaction(async (tx) => {
      for (const row of rowsToApply) {
        const previousMetric = await tx.monthlyMetric.findUnique({
          where: {
            organizationId_year_month: {
              organizationId: organization.id,
              year: row.year,
              month: row.month
            }
          }
        });
        const total = calculateEmissions(row, factorMap).total;
        const savedMetric = await tx.monthlyMetric.upsert({
          where: {
            organizationId_year_month: {
              organizationId: organization.id,
              year: row.year,
              month: row.month
            }
          },
          update: {
            ...row,
            calculatedTotalEmissionsKgCo2e: Number(total.toFixed(3)),
            appliedFactorSnapshot: factorSnapshot
          },
          create: {
            organizationId: organization.id,
            ...row,
            calculatedTotalEmissionsKgCo2e: Number(total.toFixed(3)),
            appliedFactorSnapshot: factorSnapshot
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
      }
    });

    refreshAppRoutes();
    return NextResponse.json({
      ok: true,
      importedCount: rowsToApply.length,
      creatingCount: creatingRows,
      overwritingCount: overwritingRows.length,
      invalidCount: invalidRows.length + duplicateRows.length,
      invalidRows: [...invalidRows, ...duplicateRows]
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed." },
      { status: 400 }
    );
  }
}
