import "server-only";
import { prisma, type Db } from "@/core/db/client";
import { bus, channels } from "@/core/realtime/bus";
import { requireAdmin } from "@/features/auth";
import { newWidgetToken } from "./current-run";
import { findOrCreateActiveRun } from "./run.repository";

export interface MutationContext {
  /** Transacción: pásala como último argumento a los repositorios. */
  db: Db;
  runId: string;
  /** Reglas de la run que condicionan las mutaciones. */
  nuzlocke: boolean;
}

/**
 * Unidad de trabajo: TODA mutación de datos de una run pasa por aquí.
 *   1. exige admin
 *   2. en UNA transacción (todo o nada): lee la run actual y ejecuta `fn`
 *      (así `nuzlocke` no puede cambiar entre la lectura y la escritura)
 *   4. tras el commit, avisa por tiempo real (widget y otras pestañas)
 */
export async function mutateRun<T>(fn: (ctx: MutationContext) => Promise<T>): Promise<T> {
  await requireAdmin();
  const { runId, result } = await prisma.$transaction(async (db) => {
    const run = await findOrCreateActiveRun(newWidgetToken, db);
    return { runId: run.id, result: await fn({ db, runId: run.id, nuzlocke: run.nuzlocke }) };
  });
  bus.publish(channels.run(runId));
  return result;
}
