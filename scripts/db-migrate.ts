import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { defaultDbPath, ensureDir, prismaDir } from "./db-utils";

const migrationsDir = path.join(prismaDir, "migrations");

ensureDir(prismaDir);

const database = new DatabaseSync(defaultDbPath);

database.exec(`
  CREATE TABLE IF NOT EXISTS "_local_migrations" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "appliedAt" TEXT NOT NULL
  )
`);

const appliedMigrations = new Set(
  database
    .prepare(`SELECT "name" FROM "_local_migrations"`)
    .all()
    .map((row) => String((row as { name: string }).name))
);

function tableExists(tableName: string) {
  const row = database
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get(tableName) as { name?: string } | undefined;

  return Boolean(row?.name);
}

function columnExists(tableName: string, columnName: string) {
  const columns = database.prepare(`PRAGMA table_info("${tableName}")`).all() as Array<{
    name: string;
  }>;

  return columns.some((column) => column.name === columnName);
}

function markMigrationAsApplied(name: string) {
  if (appliedMigrations.has(name)) {
    return;
  }

  database
    .prepare(`INSERT OR IGNORE INTO "_local_migrations" ("name", "appliedAt") VALUES (?, ?)`)
    .run(name, new Date().toISOString());
  appliedMigrations.add(name);
}

if (tableExists("Organization")) {
  markMigrationAsApplied("0001_init");
}

if (tableExists("AuditLog") || columnExists("EmissionFactor", "version")) {
  markMigrationAsApplied("0002_local_hardening");
}

const migrationDirectories = fs.readdirSync(migrationsDir).sort();

for (const directory of migrationDirectories) {
  if (appliedMigrations.has(directory)) {
    continue;
  }

  const sql = fs.readFileSync(path.join(migrationsDir, directory, "migration.sql"), "utf8");

  database.exec("BEGIN");

  try {
    database.exec(sql);
    database
      .prepare(`INSERT INTO "_local_migrations" ("name", "appliedAt") VALUES (?, ?)`)
      .run(directory, new Date().toISOString());
    database.exec("COMMIT");
    console.log(`Applied migration ${directory}`);
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

database.close();
