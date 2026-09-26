import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/core/config/env";
import { fail } from "@/core/result";

/** API pública de auth. Un solo usuario: cookie con el valor de ADMIN_TOKEN. */

export const ADMIN_COOKIE = "admin_token";

/** Sin ADMIN_TOKEN el panel queda abierto (solo uso local). */
export const isAuthEnabled = () => env.ADMIN_TOKEN.length > 0;

export function verifyToken(value: string | undefined): boolean {
  if (!isAuthEnabled()) return true;
  if (!value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(env.ADMIN_TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  return verifyToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

/** Obligatorio en toda mutación (lo aplica mutateRun). El proxy solo es una comprobación optimista. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) fail("UNAUTHORIZED", "Tu sesión expiró. Vuelve a entrar.");
}
