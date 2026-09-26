import "server-only";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import { env } from "../config/env";

/**
 * Cliente Prisma único (sobrevive al hot reload en desarrollo).
 * Regla: solo los archivos `*.repository.ts` y la unidad de trabajo importan este módulo.
 */
const g = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = g.prisma ?? new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: env.DATABASE_URL }) });
if (env.NODE_ENV !== "production") g.prisma = prisma;

/** Cliente o transacción: los repositorios reciben esto para poder componerse en una transacción. */
export type Db = Prisma.TransactionClient;

export type { Run as RunRow, Slot as SlotRow, HistoryEntry as HistoryRow } from "@/generated/prisma/client";
