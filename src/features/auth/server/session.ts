import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Sesión sin estado: cookie `payload.firma` con HMAC-SHA256. No guarda nada en BD. */

export type Session = { email: string; exp: number };

export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

export function createSessionValue(email: string, secret: string, now = Date.now()): string {
  const session: Session = { email, exp: Math.floor(now / 1000) + SESSION_MAX_AGE };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** Devuelve la sesión si la firma es válida y no ha expirado. */
export function readSessionValue(value: string | undefined, secret: string, now = Date.now()): Session | null {
  const [payload, signature] = value?.split(".") ?? [];
  if (!payload || !signature) return null;
  const a = Buffer.from(signature);
  const b = Buffer.from(sign(payload, secret));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    return typeof session.email === "string" && session.exp * 1000 > now ? session : null;
  } catch {
    return null;
  }
}
