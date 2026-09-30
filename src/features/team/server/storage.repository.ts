import "server-only";
import { prisma, type Db } from "@/core/db/client";
import { formatShowdown, parseShowdown } from "@/core/pokedex/showdown";
import type { StoredSets } from "../types";

/** Acceso a la tabla Storage (dueña: feature team). Caja y Muertos se guardan como texto Showdown. */

const parse = (text: string) => (text.trim() ? parseShowdown(text, Infinity).sets : []);

export async function getStorage(runId: string, db: Db = prisma): Promise<StoredSets> {
  const row = await db.storage.findUnique({ where: { runId } });
  return { box: parse(row?.box ?? ""), graveyard: parse(row?.graveyard ?? "") };
}

export async function saveStorage(runId: string, storage: StoredSets, db: Db = prisma) {
  const data = { box: formatShowdown(storage.box), graveyard: formatShowdown(storage.graveyard) };
  await db.storage.upsert({ where: { runId }, update: data, create: { runId, ...data } });
}

/** Pokémon en Muertos, por run. */
export async function countGraveyardByRun(runIds: string[], db: Db = prisma): Promise<Map<string, number>> {
  const rows = await db.storage.findMany({ where: { runId: { in: runIds } }, select: { runId: true, graveyard: true } });
  return new Map(rows.map((r) => [r.runId, parse(r.graveyard).length]));
}
