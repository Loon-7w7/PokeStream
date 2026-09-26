// Config de Prisma 7. Sin imports de runtime a propósito: así funciona también
// dentro de la imagen Docker, donde el CLI de Prisma está instalado aparte.
import type { PrismaConfig } from "prisma/config";

try {
  process.loadEnvFile(); // carga .env en desarrollo local (Node >= 21)
} catch {
  // sin .env: se usan las variables del entorno (Docker)
}

export default {
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL ?? "file:./data/app.db" },
} satisfies PrismaConfig;
