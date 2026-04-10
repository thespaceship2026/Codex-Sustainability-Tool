import { AuditAction, AuditEntityType, MetricCategory } from "@prisma/client";
import { NextResponse } from "next/server";

import { refreshAppRoutes } from "@/lib/actions";
import { assertWritableMode } from "@/lib/api-guards";
import { createAuditLog, toAuditSnapshot } from "@/lib/audit";
import { getPrimaryOrganization } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { factorInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const organization = await getPrimaryOrganization();
  const factors = await prisma.emissionFactor.findMany({
    where: { organizationId: organization.id, isCurrent: true },
    orderBy: [{ category: "asc" }, { version: "desc" }]
  });

  return NextResponse.json(factors);
}

export async function PUT(request: Request) {
  const readOnlyResponse = assertWritableMode();
  if (readOnlyResponse) {
    return readOnlyResponse;
  }

  try {
    const organization = await getPrimaryOrganization();
    const payload = factorInputSchema.array().parse(await request.json());

    await prisma.$transaction(async (tx) => {
      for (const factor of payload) {
        const currentFactor = await tx.emissionFactor.findFirst({
          where: {
            organizationId: organization.id,
            category: factor.category,
            isCurrent: true
          },
          orderBy: {
            version: "desc"
          }
        });

        if (
          currentFactor &&
          currentFactor.label === factor.label &&
          currentFactor.unit === factor.unit &&
          currentFactor.factor === Number(factor.factor) &&
          (currentFactor.description ?? "") === (factor.description ?? "")
        ) {
          continue;
        }

        if (currentFactor) {
          await tx.emissionFactor.update({
            where: {
              id: currentFactor.id
            },
            data: {
              isCurrent: false
            }
          });
        }

        const savedFactor = await tx.emissionFactor.create({
          data: {
            organizationId: organization.id,
            category: factor.category,
            version: (currentFactor?.version ?? 0) + 1,
            effectiveDate: new Date(),
            isCurrent: true,
            label: factor.label,
            unit: factor.unit,
            factor: Number(factor.factor),
            description: factor.description || null
          }
        });

        await createAuditLog(tx, {
          organizationId: organization.id,
          entityType: AuditEntityType.EMISSION_FACTOR,
          entityId: savedFactor.id,
          action: currentFactor ? AuditAction.UPDATE : AuditAction.CREATE,
          snapshotBefore: toAuditSnapshot(currentFactor),
          snapshotAfter: toAuditSnapshot(savedFactor)
        });
      }
    });

    refreshAppRoutes();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to update factors." }, { status: 400 });
  }
}
