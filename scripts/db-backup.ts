import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { backupDir, defaultDbPath, ensureDir, timestampLabel } from "./db-utils";

ensureDir(backupDir);

const backupPath = path.join(backupDir, `sustainability-tracker-${timestampLabel()}.db`);
const database = new DatabaseSync(defaultDbPath);
const escapedPath = backupPath.replaceAll("'", "''");

database.exec(`VACUUM INTO '${escapedPath}'`);
database.close();

console.log(`Backup created at ${backupPath}`);
