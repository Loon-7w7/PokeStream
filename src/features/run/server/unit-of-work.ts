import "server-only";
import { prisma, type Db } from "@/core/db/client";
import { bus, channels } from "@/core/realtime/bus";
import { requireAdmin } from "@/features/auth";
import { getCurrentRun } from "./current-run";

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
 *   2. resuelve la run actual
 *   3. ejecuta `fn` en UNA transacción (todo o nada)
 *   4. tras el commit, avisa por tiempo real (widget y otras pestañas)
 */
export async function mutateRun<T>(fn: (ctx: MutationContext) => Promise<T>): Promise<T> {
  await requireAdmin();
  const run = await getCurrentRun();
  const result = await prisma.$transaction((db) => fn({ db, runId: run.id, nuzlocke: run.nuzlocke }));
  bus.publish(channels.run(run.id));
  return result;
}
