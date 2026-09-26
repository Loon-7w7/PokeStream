// Autenticación mínima de un solo usuario: cookie con ADMIN_TOKEN.
// Si ADMIN_TOKEN está vacío, el panel queda abierto (solo para uso local).
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "admin_token";

export function isAuthDisabled() {
  return !process.env.ADMIN_TOKEN;
}

export function checkToken(value: string | undefined): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return true;
  if (!value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return checkToken(jar.get(ADMIN_COOKIE)?.value);
}

/** Llamar al inicio de cada server action que modifica datos. */
export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("No autorizado");
}
