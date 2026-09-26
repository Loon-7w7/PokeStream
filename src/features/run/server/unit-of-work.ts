import "server-only";
import { prisma, type Db } from "@/core/db/client";
import { bus, channels } from "@/core/realtime/bus";
import { requireAdmin } from "@/features/auth";
import { getCurrentRun } from "./current-run";
import { addHistory } from "./history.repository";

export interface MutationContext {
  /** Transacción: pásala como último argumento a los repositorios. */
  db: Db;
  runId: string;
  /** Reglas de la run que condicionan las mutaciones. */
  nuzlocke: boolean;
  /** Registra una línea de historial (se guarda en la misma transacción). */
  log: (message: string) => void;
}

/**
 * Unidad de trabajo: TODA mutación de datos de una run pasa por aquí.
 *   1. exige admin
 *   2. resuelve la run actual
 *   3. ejecuta `fn` + historial en UNA transacción (todo o nada)
 *   4. tras el commit, avisa por tiempo real (widget y otras pestañas)
 */
export async function mutateRun<T>(fn: (ctx: MutationContext) => Promise<T>): Promise<T> {
  await requireAdmin();
  const run = await getCurrentRun();
  const logs: string[] = [];
  const result = await prisma.$transaction(async (db) => {
    const value = await fn({ db, runId: run.id, nuzlocke: run.nuzlocke, log: (m) => logs.push(m) });
    await addHistory(run.id, logs, db);
    return value;
  });
  bus.publish(channels.run(run.id));
  return result;
}
