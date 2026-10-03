import { ZodError } from "zod";

/**
 * Resultado de una server action. Las acciones NUNCA lanzan errores al cliente:
 * en producción Next oculta el mensaje de los errores lanzados, así que devolvemos
 * `{ ok: false, error }` con un texto pensado para el usuario.
 */
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string; code: ErrorCode };

export type ErrorCode = "UNAUTHORIZED" | "NOT_FOUND" | "INVALID" | "CONFLICT" | "RATE_LIMITED" | "INTERNAL";

/** Error esperado de negocio. El mensaje se muestra tal cual al usuario (en español). */
export class DomainError extends Error {
  constructor(
    public readonly code: Exclude<ErrorCode, "INTERNAL">,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export const fail = (code: Exclude<ErrorCode, "INTERNAL">, message: string): never => {
  throw new DomainError(code, message);
};

/** Convierte cualquier error en un ActionResult. Errores inesperados se registran y se ocultan. */
export function toFailure(e: unknown): ActionResult<never> {
  if (e instanceof DomainError) return { ok: false, error: e.message, code: e.code };
  if (e instanceof ZodError) {
    const first = e.issues[0];
    return { ok: false, code: "INVALID", error: `Datos inválidos${first ? `: ${first.path.join(".")} ${first.message}` : ""}` };
  }
  console.error("[action] error inesperado", e);
  return { ok: false, code: "INTERNAL", error: "Algo salió mal. Revisa los logs del servidor." };
}
