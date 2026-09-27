// Primer arranque local: crea .env desde .env.example y aplica migraciones.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log("Creado .env — configura el login con Google (ver README) antes de usarlo fuera de tu PC.");
}
mkdirSync("data", { recursive: true });
execSync("npx prisma migrate deploy", { stdio: "inherit" });
