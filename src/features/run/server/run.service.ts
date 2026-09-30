import "server-only";
import { bus, channels } from "@/core/realtime/bus";
import { fail } from "@/core/result";
import type { RunInfo, RunOverview, WidgetConfig, WidgetConfigPatch } from "../types";
import { getCurrentRun, isWidgetTokenFormat, newWidgetToken } from "./current-run";
import * as runs from "./run.repository";
import { mutateRun, type MutationContext } from "./unit-of-work";

/** Casos de uso de la feature run. */

export async function getRunOverview(): Promise<RunOverview> {
  const run = await getCurrentRun();
  return {
    id: run.id,
    info: runs.toRunInfo(run),
    config: runs.toWidgetConfig(run),
    widgetToken: run.widgetToken,
  };
}

export const findRunIdByWidgetToken = async (token: string) => (isWidgetTokenFormat(token) ? runs.findRunIdByToken(token) : null);

/** Token vigente de la run (null si la run no existe). */
export const getWidgetToken = async (runId: string) => (await runs.findRunById(runId))?.widgetToken ?? null;

/** Lo que el widget necesita de la run: su config y si está en Nuzlocke (null si no existe). */
export async function getWidgetRun(runId: string): Promise<{ config: WidgetConfig; nuzlocke: boolean } | null> {
  const run = await runs.findRunById(runId);
  return run ? { config: runs.toWidgetConfig(run), nuzlocke: run.nuzlocke } : null;
}

export const subscribeToRun = (runId: string, onChange: () => void) => bus.subscribe(channels.run(runId), onChange);

export const updateRunInfo = (info: Partial<RunInfo>) =>
  mutateRun(async ({ db, runId }) => {
    await runs.updateRunInfo(runId, info, db);
  });

export const updateWidgetConfig = (patch: WidgetConfigPatch) =>
  mutateRun(async ({ db, runId }) => {
    if (!Object.keys(patch).length) fail("INVALID", "No hay cambios que guardar");
    await runs.updateWidgetConfig(runId, patch, db);
  });

/** Nueva partida: Nuzlocke apagado. Se llama dentro de otra mutación. */
export const resetRunInfo = ({ db, runId }: MutationContext) =>
  runs.updateRunInfo(runId, { nuzlocke: false }, db);

export const regenerateWidgetToken = () =>
  mutateRun(async ({ db, runId }) => {
    await runs.updateWidgetToken(runId, newWidgetToken(), db);
  });
