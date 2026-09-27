import "server-only";
import { bus, channels } from "@/core/realtime/bus";
import { fail } from "@/core/result";
import type { RunInfo, RunOverview, WidgetConfig, WidgetConfigPatch } from "../types";
import { getCurrentRun, newWidgetToken } from "./current-run";
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

export const findRunIdByWidgetToken = (token: string) => runs.findRunIdByToken(token);

export async function getWidgetConfig(runId: string): Promise<WidgetConfig | null> {
  const run = await runs.findRunById(runId);
  return run ? runs.toWidgetConfig(run) : null;
}

/** ¿El token sigue vigente para esa run? (deja de serlo al regenerarlo) */
export async function isWidgetTokenValid(runId: string, token: string) {
  return (await runs.findRunById(runId))?.widgetToken === token;
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
