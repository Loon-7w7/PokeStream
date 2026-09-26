// Utilidad de tests de integración: crea una BD SQLite temporal con las migraciones aplicadas.
import { createClient } from "@libsql/client";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export async function createTestDatabaseUrl(): Promise<string> {
  const url = `file:${path.join(mkdtempSync(path.join(tmpdir(), "partyhud-")), "test.db")}`;
  const db = createClient({ url });
  const dir = path.resolve(import.meta.dirname, "../prisma/migrations");
  for (const m of readdirSync(dir).filter((d) => !d.includes(".")).sort()) {
    await db.executeMultiple(readFileSync(path.join(dir, m, "migration.sql"), "utf8"));
  }
  db.close();
  return url;
}
