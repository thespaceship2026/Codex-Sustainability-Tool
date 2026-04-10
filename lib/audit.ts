import type { AuditAction, AuditEntityType, Prisma, PrismaClient } from "@prisma/client";

type AuditPayload = {
  organizationId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  snapshotBefore?: Prisma.JsonObject | null;
  snapshotAfter?: Prisma.JsonObject | null;
};

export async function createAuditLog(
  tx: Prisma.TransactionClient | PrismaClient,
  payload: AuditPayload
) {
  await tx.auditLog.create({
    data: {
      organizationId: payload.organizationId,
      entityType: payload.entityType,
      entityId: payload.entityId,
      action: payload.action,
      snapshotBefore: payload.snapshotBefore ?? undefined,
      snapshotAfter: payload.snapshotAfter ?? undefined
    }
  });
}

export function toAuditSnapshot(value: unknown) {
  if (!value) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.JsonObject;
}
