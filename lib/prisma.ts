import path from "node:path";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "prisma", "dev.db")}`
      }
    },
    log: ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
