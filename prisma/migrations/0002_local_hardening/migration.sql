ALTER TABLE "MonthlyMetric" ADD COLUMN "appliedFactorSnapshot" JSONB;

ALTER TABLE "EmissionFactor" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "EmissionFactor" ADD COLUMN "effectiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "EmissionFactor" ADD COLUMN "isCurrent" BOOLEAN NOT NULL DEFAULT true;

DROP INDEX IF EXISTS "EmissionFactor_organizationId_category_key";
CREATE UNIQUE INDEX "EmissionFactor_organizationId_category_version_key" ON "EmissionFactor"("organizationId", "category", "version");
CREATE INDEX "EmissionFactor_organizationId_category_isCurrent_idx" ON "EmissionFactor"("organizationId", "category", "isCurrent");

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "snapshotBefore" JSONB,
    "snapshotAfter" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AuditLog_organizationId_entityType_createdAt_idx" ON "AuditLog"("organizationId", "entityType", "createdAt");
