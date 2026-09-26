import "server-only";
import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { toFailure, type ActionResult } from "./result";

/**
 * Envoltorio de TODAS las server actions:
 * - captura errores y devuelve ActionResult (nunca lanza al cliente)
 * - deja pasar redirect()/notFound() de Next
 * - `refresh: true` re-renderiza los Server Components en la misma respuesta
 *   (el panel recibe el estado nuevo sin pedirlo aparte)
 */
export async function runAction<T>(fn: () => Promise<T>, opts: { refresh?: boolean } = {}): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    if (opts.refresh) refresh();
    return { ok: true, data };
  } catch (e) {
    unstable_rethrow(e);
    return toFailure(e);
  }
}
