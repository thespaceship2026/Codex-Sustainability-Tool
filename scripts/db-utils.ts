import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);

export const projectRoot = path.resolve(path.dirname(currentFilePath), "..");
export const prismaDir = path.join(projectRoot, "prisma");
export const defaultDbPath = path.join(prismaDir, "dev.db");
export const backupDir = path.join(projectRoot, "backups");

export function ensureDir(targetPath: string) {
  fs.mkdirSync(targetPath, { recursive: true });
}

export function fileExists(targetPath: string) {
  return fs.existsSync(targetPath);
}

export function timestampLabel() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function companionPaths(dbPath: string) {
  return [dbPath, `${dbPath}-wal`, `${dbPath}-shm`];
}

export function copyDbBundle(sourceDbPath: string, targetDbPath: string) {
  ensureDir(path.dirname(targetDbPath));

  for (const sourcePath of companionPaths(sourceDbPath)) {
    if (!fileExists(sourcePath)) {
      continue;
    }

    const suffix = sourcePath.slice(sourceDbPath.length);
    fs.copyFileSync(sourcePath, `${targetDbPath}${suffix}`);
  }
}

export function removeDbBundle(dbPath: string) {
  for (const filePath of companionPaths(dbPath)) {
    if (fileExists(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
  }
}
