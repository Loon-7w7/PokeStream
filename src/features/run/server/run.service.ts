import "server-only";
import { isEmailBlocked } from "@/features/auth";
import { bus, channels } from "@/core/realtime/bus";
import { fail } from "@/core/result";
import type { RunInfo, RunOverview, RunOwner, WidgetConfig, WidgetConfigPatch } from "../types";
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

/** Un dueño bloqueado por el admin pierde también su widget. */
const isOwnerBlocked = async (ownerEmail: string | null) => ownerEmail !== null && (await isEmailBlocked(ownerEmail));

/** Run del token del widget; null si el token no existe o su dueño está bloqueado. */
export async function findRunIdByWidgetToken(token: string): Promise<string | null> {
  const run = isWidgetTokenFormat(token) ? await runs.findRunByToken(token) : null;
  return run && !(await isOwnerBlocked(run.ownerEmail)) ? run.id : null;
}

/** Token vigente de la run y si su dueño está bloqueado (null si la run no existe). */
export async function getWidgetAccess(runId: string): Promise<{ token: string; blocked: boolean } | null> {
  const run = await runs.findRunById(runId);
  return run && { token: run.widgetToken, blocked: await isOwnerBlocked(run.ownerEmail) };
}

/** Usuarios con run (registrados). Para /admin: la autorización la pone quien compone. */
export async function listRunOwners(): Promise<RunOwner[]> {
  return (await runs.listOwnedRuns()).map((r) => ({ runId: r.id, email: r.ownerEmail!, createdAt: r.createdAt.toISOString(), nuzlocke: r.nuzlocke }));
}

/** Avisa a los widgets de la run de `email` para que relean su estado (p. ej. tras bloquearlo). */
export async function notifyOwnerRun(email: string) {
  const run = await runs.findRunByOwner(email);
  if (run) bus.publish(channels.run(run.id));
}

/** Lo que el widget necesita de la run: su config y si está en Nuzlocke (null si no existe). */
export async function getWidgetRun(runId: string): Promise<{ config: WidgetConfig; nuzlocke: boolean } | null> {
  const run = await runs.findRunById(runId);
  return run ? { config: runs.toWidgetConfig(run), nuzlocke: run.nuzlocke } : null;
}

export const subscribeToRun = (runId: string, onChange: () => void) => bus.subscribe(channels.run(runId), onChange);

/** El Nuzlocke no se puede desactivar: solo "Nueva partida" lo apaga (resetRunInfo). */
export const updateRunInfo = (info: Partial<RunInfo>) =>
  mutateRun(async ({ db, runId, nuzlocke }) => {
    if (nuzlocke && info.nuzlocke === false) fail("INVALID", "El modo Nuzlocke no se puede desactivar. Empieza una nueva partida para salir de él.");
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
