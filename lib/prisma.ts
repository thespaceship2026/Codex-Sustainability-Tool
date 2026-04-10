// Prisma client for Orbit v2.
//
// Runtime strategy (Notion-as-canonical, 2026-04-10):
//
// - Locally (dev):             DATABASE_URL=file:./dev.db — the repo-root
//                              SQLite file, long-lived, hand-seeded.
// - On Netlify Functions:      The function bundle ships a pre-seeded
//                              prisma/dev.db as a read-only asset. On
//                              first import in a cold start we copy it
//                              to /tmp/orbit.db (the only writable path
//                              on AWS Lambda) so the rest of the request
//                              lifecycle can write freely. The copy
//                              lives only as long as the warm function.
//                              Anything that needs durability goes to
//                              the Notion sink in lib/orbit/capture.ts.
//
// This keeps mission answers, log entries, and signal snapshots working
// without provisioning a hosted database, at the cost of those writes
// resetting between cold starts. Acceptable for a public lead magnet.

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// ────────────────────────────────────────────────────────────────────────────
// Database URL resolution
// ────────────────────────────────────────────────────────────────────────────

function resolveDatabaseUrl(): string {
  // Respect an explicit env var when set (dev, Postgres, etc).
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  // On serverless (Netlify/Lambda) the bundled DB is read-only, so we
  // copy it to /tmp on first boot and point Prisma at the writable copy.
  const isServerless =
    !!process.env.NETLIFY ||
    !!process.env.LAMBDA_TASK_ROOT ||
    !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isServerless) {
    const writable = "/tmp/orbit.db";
    const bundled = path.join(process.cwd(), "prisma", "dev.db");
    try {
      if (!fs.existsSync(writable) && fs.existsSync(bundled)) {
        fs.copyFileSync(bundled, writable);
      }
    } catch (err) {
      // Fall through — Prisma will throw a clearer error if the file
      // really isn't there. Swallowing here keeps the module import
      // side-effect-free from the perspective of the caller.
      console.error("[prisma] failed to stage /tmp/orbit.db:", err);
    }
    return `file:${writable}`;
  }

  // Local dev default.
  return `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Singleton
// ────────────────────────────────────────────────────────────────────────────

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: { url: resolveDatabaseUrl() }
    },
    log: ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
