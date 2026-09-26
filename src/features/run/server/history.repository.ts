import "server-only";
import { prisma, type Db } from "@/core/db/client";
import type { HistoryItem } from "../types";

/** Acceso a la tabla HistoryEntry (dueña: feature run). */

export const HISTORY_LIMIT = 50;

export async function addHistory(runId: string, messages: string[], db: Db = prisma) {
  if (!messages.length) return;
  await db.historyEntry.createMany({ data: messages.map((message) => ({ runId, message })) });
  const old = await db.historyEntry.findMany({
    where: { runId },
    orderBy: { createdAt: "desc" },
    skip: HISTORY_LIMIT,
    select: { id: true },
  });
  if (old.length) await db.historyEntry.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
}

export async function listHistory(runId: string, db: Db = prisma): Promise<HistoryItem[]> {
  const rows = await db.historyEntry.findMany({ where: { runId }, orderBy: { createdAt: "desc" }, take: HISTORY_LIMIT });
  return rows.map((h) => ({ id: h.id, message: h.message, createdAt: h.createdAt.toISOString() }));
}
