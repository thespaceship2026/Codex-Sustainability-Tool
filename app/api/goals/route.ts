import { AuditAction, AuditEntityType, MetricCategory } from "@prisma/client";
import { NextResponse } from "next/server";

import { refreshAppRoutes } from "@/lib/actions";
import { assertWritableMode } from "@/lib/api-guards";
import { createAuditLog, toAuditSnapshot } from "@/lib/audit";
import { getPrimaryOrganization } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { goalInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const organization = await getPrimaryOrganization();
  const goals = await prisma.sustainabilityGoal.findMany({
    where: { organizationId: organization.id },
    orderBy: {
      category: "asc"
    }
  });

  return NextResponse.json(goals);
}

export async function PUT(request: Request) {
  const readOnlyResponse = assertWritableMode();
  if (readOnlyResponse) {
    return readOnlyResponse;
  }

  try {
    const organization = await getPrimaryOrganization();
    const payload = goalInputSchema.array().parse(await request.json());

    await prisma.$transaction(async (tx) => {
      for (const goal of payload) {
        const previousGoal = await tx.sustainabilityGoal.findUnique({
          where: {
            organizationId_category: {
              organizationId: organization.id,
              category: goal.category
            }
          }
        });

        const savedGoal = await tx.sustainabilityGoal.upsert({
          where: {
            organizationId_category: {
              organizationId: organization.id,
              category: goal.category
            }
          },
          update: {
            label: goal.label,
            unit: goal.unit,
            targetValue: Number(goal.targetValue),
            targetMonth: Number(goal.targetMonth),
            targetYear: Number(goal.targetYear)
          },
          create: {
            organizationId: organization.id,
            category: goal.category,
            label: goal.label,
            unit: goal.unit,
            targetValue: Number(goal.targetValue),
            targetMonth: Number(goal.targetMonth),
            targetYear: Number(goal.targetYear)
          }
        });

        await createAuditLog(tx, {
          organizationId: organization.id,
          entityType: AuditEntityType.SUSTAINABILITY_GOAL,
          entityId: savedGoal.id,
          action: previousGoal ? AuditAction.UPDATE : AuditAction.CREATE,
          snapshotBefore: toAuditSnapshot(previousGoal),
          snapshotAfter: toAuditSnapshot(savedGoal)
        });
      }
    });

    refreshAppRoutes();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to update goals." }, { status: 400 });
  }
}
