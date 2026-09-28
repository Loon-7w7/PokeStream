import "server-only";
import { randomBytes } from "node:crypto";
import { findActiveRun, findOrCreateActiveRun, type RunRow } from "./run.repository";

export const newWidgetToken = () => randomBytes(18).toString("base64url");

/** Formato de newWidgetToken (18 bytes = 24 caracteres base64url). Filtra basura sin consultar la BD. */
export const isWidgetTokenFormat = (token: string) => /^[A-Za-z0-9_-]{24}$/.test(token);

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
  creating ??= findOrCreateActiveRun(newWidgetToken).finally(() => (creating = null));
  return creating;
}
