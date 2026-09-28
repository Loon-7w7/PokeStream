import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Cookie `payload.firma` con HMAC-SHA256. El payload solo lleva el id de la sesión;
 * el correo vive en la tabla Session, así que borrar la fila la invalida (logout real).
 * La firma permite descartar cookies falsas sin consultar la BD.
 */

export type SessionCookie = { sid: string; exp: number };

export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export const newSessionId = () => randomBytes(32).toString("base64url");

const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

export function createSessionValue(sid: string, secret: string, now = Date.now()): string {
  const session: SessionCookie = { sid, exp: Math.floor(now / 1000) + SESSION_MAX_AGE };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** Devuelve la sesión si la firma es válida y no ha expirado. */
export function readSessionValue(value: string | undefined, secret: string, now = Date.now()): SessionCookie | null {
  const [payload, signature] = value?.split(".") ?? [];
  if (!payload || !signature) return null;
  const a = Buffer.from(signature);
  const b = Buffer.from(sign(payload, secret));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionCookie;
    return typeof session.sid === "string" && session.exp * 1000 > now ? session : null;
  } catch {
    return null;
  }
}
