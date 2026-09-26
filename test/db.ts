// Utilidad de tests de integración: crea una BD SQLite temporal con las migraciones aplicadas.
import Database from "better-sqlite3";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export function createTestDatabaseUrl(): string {
  const file = path.join(mkdtempSync(path.join(tmpdir(), "partyhud-")), "test.db");
  const db = new Database(file);
  const dir = path.resolve(import.meta.dirname, "../prisma/migrations");
  for (const m of readdirSync(dir).filter((d) => !d.includes(".")).sort()) {
    db.exec(readFileSync(path.join(dir, m, "migration.sql"), "utf8"));
  }
  db.close();
  return `file:${file}`;
}
