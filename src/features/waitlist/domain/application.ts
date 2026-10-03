// Reglas del preregistro a la beta. DOMINIO PURO.
import type { ApplicationStatus, Platform } from "../types";

export const PLATFORMS = ["twitch", "kick", "youtube", "other"] as const satisfies readonly Platform[];

const HOSTS: Record<Exclude<Platform, "other">, { host: RegExp; url: (handle: string) => string }> = {
  twitch: { host: /^(www\.|m\.)?twitch\.tv$/, url: (h) => `https://twitch.tv/${h}` },
  kick: { host: /^(www\.)?kick\.com$/, url: (h) => `https://kick.com/${h}` },
  youtube: { host: /^(www\.|m\.)?youtube\.com$/, url: (h) => `https://youtube.com/@${h}` },
};

const isHttpUrl = (text: string) => /^https?:\/\/\S+$/i.test(text);

/**
 * Canal tal como se guarda: en Twitch/Kick/YouTube solo el usuario (acepta "@usuario" o la URL del canal);
 * en "other", lo que escriba (normalmente una URL).
 */
export function normalizeChannel(platform: Platform, input: string): string {
  const text = input.trim();
  if (platform === "other") return text;
  let handle = text;
  if (isHttpUrl(text) || /^[\w.-]+\.(tv|com)\//i.test(text)) {
    try {
      const url = new URL(isHttpUrl(text) ? text : `https://${text}`);
      if (HOSTS[platform].host.test(url.hostname.toLowerCase())) handle = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } catch {
      // no es una URL válida: se queda tal cual
    }
  }
  return handle.replace(/^@/, "");
}

/** Enlace al canal para /admin. Solo http(s): nunca se enlaza texto arbitrario (evita `javascript:`). */
export function channelUrl(platform: Platform, channel: string): string | null {
  if (platform === "other") return isHttpUrl(channel) ? channel : null;
  return /^[\w.-]+$/.test(channel) ? HOSTS[platform].url(channel) : null;
}

/**
 * Qué hacer con un envío según lo que ya hay para ese correo.
 * Nuevo o pendiente: se guarda (se actualizan los datos). Ya revisado: se ignora en silencio
 * (la respuesta es la misma para no revelar si un correo fue aprobado o rechazado).
 */
export const shouldSaveSubmission = (existing: ApplicationStatus | null) => existing === null || existing === "pending";

/** Transiciones que puede hacer el admin: aprobar desde pendiente o rechazado; rechazar solo lo pendiente. */
export function canReview(from: ApplicationStatus, to: Exclude<ApplicationStatus, "pending">): boolean {
  return to === "approved" ? from !== "approved" : from === "pending";
}
