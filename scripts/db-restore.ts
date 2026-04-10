import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  backupDir,
  copyDbBundle,
  defaultDbPath,
  ensureDir,
  fileExists,
  removeDbBundle,
  timestampLabel
} from "./db-utils";

function resolveRestoreSource() {
  const flagIndex = process.argv.findIndex((argument) => argument === "--file");
  const provided = flagIndex >= 0 ? process.argv[flagIndex + 1] : undefined;

  if (provided) {
    return path.resolve(provided);
  }

  if (!fileExists(backupDir)) {
    throw new Error("No backups directory found. Run npm run db:backup first.");
  }

  const latest = fs
    .readdirSync(backupDir)
    .filter((name) => name.endsWith(".db"))
    .sort()
    .at(-1);

  if (!latest) {
    throw new Error("No backup files found. Run npm run db:backup first.");
  }

  return path.join(backupDir, latest);
}

const sourceDbPath = resolveRestoreSource();

ensureDir(backupDir);

if (!fileExists(sourceDbPath)) {
  throw new Error(`Backup file not found: ${sourceDbPath}`);
}

if (fileExists(defaultDbPath)) {
  const safetyBackupPath = path.join(backupDir, `pre-restore-${timestampLabel()}.db`);
  copyDbBundle(defaultDbPath, safetyBackupPath);
  console.log(`Safety backup created at ${safetyBackupPath}`);
}

removeDbBundle(defaultDbPath);
copyDbBundle(sourceDbPath, defaultDbPath);

const database = new DatabaseSync(defaultDbPath);
const integrityCheck = database.prepare("PRAGMA integrity_check").all() as Array<{
  integrity_check: string;
}>;
database.close();

if (!integrityCheck.every((row) => row.integrity_check === "ok")) {
  throw new Error("Integrity check failed after restore.");
}

console.log(`Database restored from ${sourceDbPath}`);
