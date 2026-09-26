import "server-only";
import { randomBytes } from "node:crypto";
import { createRun, findActiveRun, type RunRow } from "./run.repository";

export const newWidgetToken = () => randomBytes(18).toString("base64url");

// Evita crear dos runs si varias lecturas llegan a la vez en el primer arranque
let creating: Promise<RunRow> | null = null;

/**
 * Punto ÚNICO que decide "qué run está usando el usuario".
 * Hoy: un solo usuario => la primera run activa (se crea si no existe).
 * Multiusuario: resolverla aquí a partir de la sesión; nada más debe cambiar.
 */
export async function getCurrentRun(): Promise<RunRow> {
  const existing = await findActiveRun();
  if (existing) return existing;
  creating ??= createRun(newWidgetToken()).finally(() => (creating = null));
  return creating;
}
