import "server-only";
import { prisma, type Db, type RunRow } from "@/core/db/client";
import { DEFAULT_SLOT_POSITIONS, type RunInfo, type SlotPoint, type WidgetConfig, type WidgetConfigPatch } from "../types";

export type { RunRow };

/**
 * Acceso a la tabla Run (dueña: feature run).
 * Convención de repositorios: el último parámetro es `db` (por defecto el cliente global);
 * dentro de mutateRun se pasa la transacción.
 */

export const findActiveRun = (db: Db = prisma) =>
  db.run.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } });

export const createRun = (widgetToken: string, db: Db = prisma) => db.run.create({ data: { widgetToken } });

export const findRunById = (id: string, db: Db = prisma) => db.run.findUnique({ where: { id } });

export const findRunIdByToken = async (widgetToken: string, db: Db = prisma) =>
  (await db.run.findUnique({ where: { widgetToken }, select: { id: true } }))?.id ?? null;

export const updateRunInfo = (id: string, info: Partial<RunInfo>, db: Db = prisma) =>
  db.run.update({ where: { id }, data: info });

export function updateWidgetConfig(id: string, patch: WidgetConfigPatch, db: Db = prisma) {
  const { slotPositions, ...rest } = patch;
  return db.run.update({ where: { id }, data: { ...rest, ...(slotPositions && { slotPositions: JSON.stringify(slotPositions) }) } });
}

export const updateWidgetToken = (id: string, widgetToken: string, db: Db = prisma) =>
  db.run.update({ where: { id }, data: { widgetToken } });

/** JSON guardado -> 6 puntos válidos; si falta o está corrupto, las posiciones por defecto. */
function parsePositions(json: string): SlotPoint[] {
  try {
    const list = json ? (JSON.parse(json) as SlotPoint[]) : [];
    const valid = Array.isArray(list) && list.length === 6 && list.every((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y));
    return valid ? list.map(({ x, y }) => ({ x, y })) : DEFAULT_SLOT_POSITIONS;
  } catch {
    return DEFAULT_SLOT_POSITIONS;
  }
}

export function toWidgetConfig(row: RunRow): WidgetConfig {
  return {
    layout: row.layout === "free" ? "free" : "hud-bottom",
    slotPositions: parsePositions(row.slotPositions),
    opacity: row.opacity,
    scale: row.scale,
    gap: row.gap,
    pokeballOpacity: row.pokeballOpacity,
    showNickname: row.showNickname,
    showTypes: row.showTypes,
    faintEffect: row.faintEffect,
    animated: row.animated,
  };
}

export const toRunInfo = (row: RunRow): RunInfo => ({ title: row.title, game: row.game, ruleset: row.ruleset, nuzlocke: row.nuzlocke });
