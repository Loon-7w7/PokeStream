import "server-only";
import { prisma, type Db, type RunRow } from "@/core/db/client";
import type { RunInfo, WidgetConfig, WidgetConfigPatch } from "../types";

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

export const updateWidgetConfig = (id: string, patch: WidgetConfigPatch, db: Db = prisma) =>
  db.run.update({ where: { id }, data: patch });

export const updateWidgetToken = (id: string, widgetToken: string, db: Db = prisma) =>
  db.run.update({ where: { id }, data: { widgetToken } });

export function toWidgetConfig(row: RunRow): WidgetConfig {
  return {
    layout: "hud-bottom",
    opacity: row.opacity,
    scale: row.scale,
    gap: row.gap,
    showNickname: row.showNickname,
    showLevel: row.showLevel,
    showTypes: row.showTypes,
    faintEffect: row.faintEffect,
    animated: row.animated,
  };
}

export const toRunInfo = (row: RunRow): RunInfo => ({ title: row.title, game: row.game, ruleset: row.ruleset, nuzlocke: row.nuzlocke });
