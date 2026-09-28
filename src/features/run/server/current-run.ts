import "server-only";
import { randomBytes } from "node:crypto";
import { env } from "@/core/config/env";
import { isAuthEnabled, requireUser } from "@/features/auth";
import { findOrCreateRunForOwner, findRunByOwner, type OwnerRunOptions, type RunRow } from "./run.repository";

export const newWidgetToken = () => randomBytes(18).toString("base64url");

/** Formato de newWidgetToken (18 bytes = 24 caracteres base64url). Filtra basura sin consultar la BD. */
export const isWidgetTokenFormat = (token: string) => /^[A-Za-z0-9_-]{24}$/.test(token);

/** La run sin dueño (de antes del multiusuario) es del usuario local o de LEGACY_OWNER_EMAIL. */
export const ownerRunOptions = (email: string): OwnerRunOptions => ({
  newToken: newWidgetToken,
  claimOrphan: !isAuthEnabled() || (env.LEGACY_OWNER_EMAIL !== "" && email === env.LEGACY_OWNER_EMAIL),
});

// Evita crear dos runs si varias lecturas del mismo usuario llegan a la vez en su primer acceso
const creating = new Map<string, Promise<RunRow>>();

/**
 * Punto ÚNICO que decide "qué run está usando el usuario": la de su sesión.
 * Sin sesión válida lanza UNAUTHORIZED. La primera vez se le crea una vacía.
 */
export async function getCurrentRun(): Promise<RunRow> {
  const email = await requireUser();
  const existing = await findRunByOwner(email);
  if (existing) return existing;
  let pending = creating.get(email);
  if (!pending) {
    pending = findOrCreateRunForOwner(email, ownerRunOptions(email)).finally(() => creating.delete(email));
    creating.set(email, pending);
  }
  return pending;
}
