// Aplica prisma/migrations a una BD libsql remota (Turso). `prisma migrate deploy` solo acepta `file:`.
// Registra cada migración en `_prisma_migrations` con el mismo formato que Prisma (checksum sha256).
import { createHash, randomUUID } from "node:crypto";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";

try {
  process.loadEnvFile();
} catch {
  // sin .env: variables del entorno
}

const url = process.env.DATABASE_URL ?? "";
const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;
if (url.startsWith("file:") || !url) {
  console.error("DATABASE_URL es local: usa `npm run db:deploy`.");
  process.exit(1);
}
if (!authToken) {
  console.error("Falta DATABASE_AUTH_TOKEN en .env.");
  process.exit(1);
}

const db = createClient({ url, authToken });
const dir = "prisma/migrations";

await db.execute(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "checksum" TEXT NOT NULL,
  "finished_at" DATETIME,
  "migration_name" TEXT NOT NULL,
  "logs" TEXT,
  "rolled_back_at" DATETIME,
  "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
  "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
)`);

const { rows } = await db.execute(
  `SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`,
);
const applied = new Set(rows.map((row) => row.migration_name));

const pending = readdirSync(dir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(dir, entry.name, "migration.sql")))
  .map((entry) => entry.name)
  .sort()
  .filter((name) => !applied.has(name));

if (!pending.length) {
  console.log("La BD remota ya está al día.");
  process.exit(0);
}

for (const name of pending) {
  const sql = readFileSync(join(dir, name, "migration.sql"), "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  const id = randomUUID();
  const started = new Date().toISOString();
  try {
    await db.executeMultiple(sql);
  } catch (error) {
    console.error(`✗ ${name}: ${error.message}`);
    process.exit(1);
  }
  await db.execute({
    sql: `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
          VALUES (?, ?, ?, ?, ?, 1)`,
    args: [id, checksum, new Date().toISOString(), name, started],
  });
  console.log(`✓ ${name}`);
}
console.log(`${pending.length} migración(es) aplicada(s).`);
