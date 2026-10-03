import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { env } from "@/core/config/env";
import { fail } from "@/core/result";
import { canEnter } from "./domain/access";
import * as access from "./server/access.repository";
import * as admin from "./server/access.service";
import { createGoogleAuthorization, getVerifiedEmail } from "./server/google";
import { SESSION_MAX_AGE, createSessionValue, newSessionId, readSessionValue } from "./server/session";
import * as sessions from "./server/session.repository";
import type { LoginError } from "./types";

/**
 * API pública de auth. Login con Google; quién entra lo decide `canEnter` (domain/access.ts):
 * admins (ADMIN_EMAILS) siempre, bloqueados nunca y el resto según el modo (registro abierto o solo invitados),
 * que se gestiona en /admin. Cada correo es un usuario con su propia run. La cookie firmada apunta a una fila de Session.
 */

export const SESSION_COOKIE = "session";
const OAUTH_COOKIE = "google_oauth"; // state + codeVerifier mientras dura el login

/** Sin GOOGLE_CLIENT_ID el panel queda abierto (solo uso local). */
export const isAuthEnabled = () => env.GOOGLE_CLIENT_ID.length > 0;

/** Usuario único cuando no hay login (uso local). */
export const LOCAL_USER = "local";

const isAdminEmail = (email: string) => env.ADMIN_EMAILS.includes(email);

async function isAllowed(email: string): Promise<boolean> {
  const [entry, registrationOpen] = await Promise.all([access.findAccess(email), access.getRegistrationOpen()]);
  return canEnter({ isAdmin: isAdminEmail(email), entry, registrationOpen });
}

/** ¿Puede entrar cualquier cuenta de Google? (sin login, uso local, se considera abierto). Público: no exige admin. */
export async function isRegistrationOpen(): Promise<boolean> {
  return !isAuthEnabled() || access.getRegistrationOpen();
}

/** ¿El admin bloqueó este correo? Un bloqueado pierde el panel y su widget. */
export async function isEmailBlocked(email: string): Promise<boolean> {
  return !isAdminEmail(email) && Boolean((await access.findAccess(email))?.blocked);
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.APP_URL.startsWith("https://"),
  path: "/",
  maxAge,
});

/** Cookie firmada y vigente (sin tocar la BD). */
async function readSessionCookie() {
  return readSessionValue((await cookies()).get(SESSION_COOKIE)?.value, env.SESSION_SECRET);
}

/**
 * Correo con sesión válida: firma correcta, fila en BD sin expirar y correo permitido.
 * Bloquear el correo o cerrar sesión la invalida al instante.
 * `cache`: una sola consulta por petición aunque se llame varias veces.
 */
export const getSessionEmail = cache(async (): Promise<string | null> => {
  const cookie = await readSessionCookie();
  if (!cookie) return null;
  const session = await sessions.findSession(cookie.sid);
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  return (await isAllowed(session.email)) ? session.email : null;
});

/** Correo del usuario actual (LOCAL_USER sin login) o null si no hay sesión válida. */
export async function getCurrentUser(): Promise<string | null> {
  return isAuthEnabled() ? getSessionEmail() : LOCAL_USER;
}

export async function isSignedIn(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

/**
 * Obligatorio en toda lectura o mutación de datos de un usuario (lo aplican getCurrentRun y mutateRun).
 * El proxy solo es una comprobación optimista.
 */
export async function requireUser(): Promise<string> {
  return (await getCurrentUser()) ?? fail("UNAUTHORIZED", "Tu sesión expiró. Vuelve a entrar.");
}

/** ¿El usuario actual es admin? Sin login (uso local) el único usuario lo es. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!isAuthEnabled()) return true;
  const email = await getSessionEmail();
  return email !== null && isAdminEmail(email);
}

/** Autorización de /admin y de sus acciones. */
export async function requireAdmin(): Promise<string> {
  const email = await requireUser();
  if (isAuthEnabled() && !isAdminEmail(email)) fail("UNAUTHORIZED", "No tienes permiso para esto.");
  return email;
}

// ---------- Administración del acceso (solo admins) ----------

/** Envuelve un caso de uso para que solo lo ejecute un admin. */
const asAdmin =
  <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
  async (...args: A) => {
    await requireAdmin();
    return fn(...args);
  };

export const getAccessOverview = asAdmin(() => admin.getAccessOverview(env.ADMIN_EMAILS));
export const setRegistrationOpen = asAdmin(admin.setRegistrationOpen);
export const inviteEmails = asAdmin(admin.inviteEmails);
export const removeInvite = asAdmin(admin.removeInvite);
export const setBlocked = asAdmin((email: string, blocked: boolean) => admin.setBlocked(email, blocked, isAdminEmail(email)));
export const endSessionsOf = asAdmin(admin.endSessionsOf);
export { parseEmailList } from "./domain/access";

/** Inicio del login: guarda state/verifier y devuelve la URL de Google a la que redirigir. */
export async function startGoogleLogin(): Promise<string> {
  if (!isAuthEnabled()) return "/";
  const { url, state, codeVerifier } = createGoogleAuthorization();
  (await cookies()).set(OAUTH_COOKIE, `${state}.${codeVerifier}`, cookieOptions(60 * 10));
  return url.toString();
}

/** Callback de Google: valida state, comprueba el correo, crea la sesión y devuelve a dónde redirigir. */
export async function finishGoogleLogin(params: URLSearchParams): Promise<string> {
  const jar = await cookies();
  const [savedState, codeVerifier] = jar.get(OAUTH_COOKIE)?.value.split(".") ?? [];
  jar.delete(OAUTH_COOKIE);
  const error = (code: LoginError) => `/login?error=${code}`;

  const code = params.get("code");
  if (!code || !savedState || !codeVerifier || params.get("state") !== savedState) return error("invalid_state");

  let email: string | null;
  try {
    email = await getVerifiedEmail(code, codeVerifier);
  } catch (e) {
    console.error("[auth] Falló el canje del código de Google", e);
    return error("google_failed");
  }
  if (!email || !(await isAllowed(email))) return error("not_allowed");
  await access.upsertAccess(email, { lastLoginAt: new Date() });

  const sid = newSessionId();
  await sessions.deleteExpiredSessions(new Date());
  await sessions.createSession(sid, email, new Date(Date.now() + SESSION_MAX_AGE * 1000));
  jar.set(SESSION_COOKIE, createSessionValue(sid, env.SESSION_SECRET), cookieOptions(SESSION_MAX_AGE));
  return "/";
}

/** Logout: borra la sesión de la BD (la cookie robada deja de valer) y la cookie. */
export async function endSession(): Promise<void> {
  const cookie = await readSessionCookie();
  if (cookie) await sessions.deleteSession(cookie.sid);
  (await cookies()).delete(SESSION_COOKIE);
}
