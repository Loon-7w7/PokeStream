// Primer arranque local: crea .env desde .env.example y aplica migraciones.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log("Creado .env — configura el login con Google (ver README) antes de usarlo fuera de tu PC.");
}
process.loadEnvFile();

// `prisma migrate deploy` solo acepta `file:`; una BD remota (Turso) usa el script propio.
const url = process.env.DATABASE_URL ?? "file:./data/app.db";
if (url.startsWith("file:")) {
  mkdirSync("data", { recursive: true });
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} else {
  execSync("node scripts/migrate-remote.mjs", { stdio: "inherit" });
}
