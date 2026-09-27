import "server-only";
import { cookies } from "next/headers";
import { env } from "@/core/config/env";
import { fail } from "@/core/result";
import { createGoogleAuthorization, getVerifiedEmail } from "./server/google";
import { SESSION_MAX_AGE, createSessionValue, readSessionValue } from "./server/session";
import type { LoginError } from "./types";

/**
 * API pública de auth. Login con Google: entran los correos de ALLOWED_EMAILS
 * y todos comparten el mismo run. La sesión es una cookie firmada (sin BD).
 */

export const SESSION_COOKIE = "session";
const OAUTH_COOKIE = "google_oauth"; // state + codeVerifier mientras dura el login

/** Sin GOOGLE_CLIENT_ID el panel queda abierto (solo uso local). */
export const isAuthEnabled = () => env.GOOGLE_CLIENT_ID.length > 0;

const isAllowed = (email: string) => env.ALLOWED_EMAILS.includes(email);

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.APP_URL.startsWith("https://"),
  path: "/",
  maxAge,
});

/** Correo con sesión válida. Quitarlo de ALLOWED_EMAILS cierra su sesión al instante. */
export async function getSessionEmail(): Promise<string | null> {
  const session = readSessionValue((await cookies()).get(SESSION_COOKIE)?.value, env.SESSION_SECRET);
  return session && isAllowed(session.email) ? session.email : null;
}

export async function isAdmin(): Promise<boolean> {
  return !isAuthEnabled() || (await getSessionEmail()) !== null;
}

/** Obligatorio en toda mutación (lo aplica mutateRun). El proxy solo es una comprobación optimista. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) fail("UNAUTHORIZED", "Tu sesión expiró. Vuelve a entrar.");
}

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
  if (!email || !isAllowed(email)) return error("not_allowed");

  jar.set(SESSION_COOKIE, createSessionValue(email, env.SESSION_SECRET), cookieOptions(SESSION_MAX_AGE));
  return "/";
}
