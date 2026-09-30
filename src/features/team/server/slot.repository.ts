import "server-only";
import { prisma, type Db, type SlotRow } from "@/core/db/client";
import type { StatsTable } from "@/core/pokedex/types";
import { emptySlot } from "../domain/slot";
import { TEAM_SIZE, type SlotData } from "../types";

/** Acceso a la tabla Slot (dueña: feature team). `db` siempre es el último parámetro. */

const parseJson = <T>(s: string, fallback: T): T => {
  try {
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
};

function toSlot(row: SlotRow): SlotData {
  return {
    position: row.position,
    species: row.species,
    nickname: row.nickname,
    ability: row.ability,
    item: row.item,
    nature: row.nature,
    teraType: row.teraType,
    gender: row.gender === "M" || row.gender === "F" ? row.gender : "",
    shiny: row.shiny,
    fainted: row.fainted,
    moves: parseJson<string[]>(row.moves, []),
    evs: parseJson<StatsTable | null>(row.evs, null),
    ivs: parseJson<StatsTable | null>(row.ivs, null),
  };
}

function toRow(slot: SlotData) {
  const { position: _position, moves, evs, ivs, ...rest } = slot;
  return {
    ...rest,
    moves: JSON.stringify(moves.slice(0, 4)),
    evs: evs ? JSON.stringify(evs) : "",
    ivs: ivs ? JSON.stringify(ivs) : "",
  };
}

/** Garantiza que existan las 6 filas de la run (se crean vacías la primera vez). */
export async function ensureSlots(runId: string, db: Db = prisma) {
  const existing = await db.slot.findMany({ where: { runId }, select: { position: true } });
  const have = new Set(existing.map((s) => s.position));
  const missing = Array.from({ length: TEAM_SIZE }, (_, i) => i).filter((p) => !have.has(p));
  if (missing.length) await db.slot.createMany({ data: missing.map((position) => ({ runId, position })) });
}

export async function listSlots(runId: string, db: Db = prisma): Promise<SlotData[]> {
  const read = () => db.slot.findMany({ where: { runId }, orderBy: { position: "asc" } });
  let rows = await read();
  // Solo escribe la primera vez: las lecturas normales (widget público) son una sola consulta
  if (rows.length < TEAM_SIZE) {
    await ensureSlots(runId, db);
    rows = await read();
  }
  return rows.map(toSlot);
}

export async function findSlot(runId: string, position: number, db: Db = prisma): Promise<SlotData> {
  const row = await db.slot.findUnique({ where: { runId_position: { runId, position } } });
  return row ? toSlot(row) : emptySlot(position);
}

/** Guarda el slot completo en su posición (upsert). */
export async function saveSlot(runId: string, slot: SlotData, db: Db = prisma) {
  const data = toRow(slot);
  await db.slot.upsert({
    where: { runId_position: { runId, position: slot.position } },
    update: data,
    create: { runId, position: slot.position, ...data },
  });
}

/** Reordena: order[i] = posición anterior del slot que queda en i. */
export async function reorderSlots(runId: string, order: number[], db: Db = prisma) {
  await ensureSlots(runId, db);
  const rows = await db.slot.findMany({ where: { runId }, select: { id: true, position: true } });
  const idByPos = new Map(rows.map((r) => [r.position, r.id]));
  // Posiciones temporales para no chocar con el índice único (runId, position)
  for (const r of rows) await db.slot.update({ where: { id: r.id }, data: { position: r.position + 100 } });
  for (const [newPos, oldPos] of order.entries()) {
    await db.slot.update({ where: { id: idByPos.get(oldPos)! }, data: { position: newPos } });
  }
}

/** Especies más usadas en todos los equipos (una por slot ocupado). Para /admin. */
export async function countSpecies(limit: number, db: Db = prisma) {
  const rows = await db.slot.groupBy({
    by: ["species"],
    where: { species: { not: "" } },
    _count: { _all: true },
    orderBy: { _count: { species: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({ species: r.species, count: r._count._all }));
}

/** Debilitados que siguen en el equipo, por run. */
export async function countFaintedByRun(runIds: string[], db: Db = prisma): Promise<Map<string, number>> {
  const rows = await db.slot.groupBy({ by: ["runId"], where: { runId: { in: runIds }, fainted: true, species: { not: "" } }, _count: { _all: true } });
  return new Map(rows.map((r) => [r.runId, r._count._all]));
}
