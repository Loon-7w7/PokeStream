// Lectura/escritura de la run activa y mapeo BD <-> tipos. SOLO servidor.
import { randomBytes } from "node:crypto";
import { prisma } from "./db";
import { toSlotView } from "./dex";
import type { Run, Slot } from "@/generated/prisma/client";
import type { RunState, SlotData, StatsTable, WidgetConfig, WidgetState } from "./types";

const HISTORY_LIMIT = 50;

export const newToken = () => randomBytes(18).toString("base64url");

/** Devuelve la run activa; la crea (con 6 slots vacíos) si no existe. */
export async function getActiveRun() {
  const existing = await prisma.run.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return prisma.run.create({
    data: {
      widgetToken: newToken(),
      slots: { create: Array.from({ length: 6 }, (_, position) => ({ position })) },
    },
  });
}

const parseJson = <T>(s: string, fallback: T): T => {
  try {
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
};

export function rowToSlot(row: Slot): SlotData {
  return {
    position: row.position,
    species: row.species,
    nickname: row.nickname,
    level: row.level,
    hpCurrent: row.hpCurrent,
    hpMax: row.hpMax,
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

/** Convierte datos de slot (parciales) a columnas de BD. */
export function slotToRow(d: Partial<Omit<SlotData, "position">>) {
  const { moves, evs, ivs, ...rest } = d;
  return {
    ...rest,
    ...(moves !== undefined && { moves: JSON.stringify(moves.slice(0, 4)) }),
    ...(evs !== undefined && { evs: evs ? JSON.stringify(evs) : "" }),
    ...(ivs !== undefined && { ivs: ivs ? JSON.stringify(ivs) : "" }),
  };
}

export const EMPTY_SLOT: Omit<SlotData, "position"> = {
  species: "",
  nickname: "",
  level: 50,
  hpCurrent: 0,
  hpMax: 0,
  ability: "",
  item: "",
  nature: "",
  teraType: "",
  gender: "",
  shiny: false,
  fainted: false,
  moves: [],
  evs: null,
  ivs: null,
};

export function runConfig(run: Run): WidgetConfig {
  return {
    layout: "hud-bottom",
    opacity: run.opacity,
    scale: run.scale,
    gap: run.gap,
    showHp: run.showHp,
    showNickname: run.showNickname,
    showLevel: run.showLevel,
    showTypes: run.showTypes,
    faintEffect: run.faintEffect,
    animated: run.animated,
  };
}

async function loadSlots(runId: string) {
  const rows = await prisma.slot.findMany({ where: { runId }, orderBy: { position: "asc" } });
  return rows.map(rowToSlot);
}

export async function getRunState(): Promise<RunState> {
  const run = await getActiveRun();
  const [slots, history] = await Promise.all([
    loadSlots(run.id),
    prisma.historyEntry.findMany({ where: { runId: run.id }, orderBy: { createdAt: "desc" }, take: HISTORY_LIMIT }),
  ]);
  return {
    id: run.id,
    title: run.title,
    game: run.game,
    ruleset: run.ruleset,
    widgetToken: run.widgetToken,
    config: runConfig(run),
    slots: slots.map(toSlotView),
    history: history.map((h) => ({ id: h.id, message: h.message, createdAt: h.createdAt.toISOString() })),
  };
}

export async function getRunIdByToken(token: string): Promise<string | null> {
  const run = await prisma.run.findUnique({ where: { widgetToken: token }, select: { id: true } });
  return run?.id ?? null;
}

export async function getWidgetState(runId: string): Promise<WidgetState | null> {
  const run = await prisma.run.findUnique({ where: { id: runId } });
  if (!run) return null;
  const slots = (await loadSlots(run.id)).filter((s) => s.species).map(toSlotView);
  return {
    config: runConfig(run),
    slots: slots.map((s) => ({
      position: s.position,
      speciesName: s.speciesName,
      spriteId: s.spriteId,
      nickname: s.nickname,
      level: s.level,
      hpCurrent: s.hpCurrent,
      hpMax: s.hpMax,
      types: s.types,
      shiny: s.shiny,
      fainted: s.fainted,
    })),
  };
}

export async function addHistory(runId: string, message: string) {
  await prisma.historyEntry.create({ data: { runId, message } });
  // Mantener solo las últimas entradas
  const old = await prisma.historyEntry.findMany({
    where: { runId },
    orderBy: { createdAt: "desc" },
    skip: HISTORY_LIMIT,
    select: { id: true },
  });
  if (old.length) await prisma.historyEntry.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
}
