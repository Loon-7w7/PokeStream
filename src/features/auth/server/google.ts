import "server-only";
import { Google, decodeIdToken, generateCodeVerifier, generateState } from "arctic";
import { env } from "@/core/config/env";

const google = () => new Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, `${env.APP_URL}/api/auth/google/callback`);

/** URL de consentimiento de Google + los valores que hay que guardar hasta el callback (PKCE). */
export function createGoogleAuthorization() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google().createAuthorizationURL(state, codeVerifier, ["openid", "email"]);
  url.searchParams.set("prompt", "select_account");
  return { url, state, codeVerifier };
}

/** Canjea el código por el id_token y devuelve el correo si Google lo verificó. */
export async function getVerifiedEmail(code: string, codeVerifier: string): Promise<string | null> {
  const tokens = await google().validateAuthorizationCode(code, codeVerifier);
  const claims = decodeIdToken(tokens.idToken()) as { email?: string; email_verified?: boolean };
  return claims.email && claims.email_verified ? claims.email.toLowerCase() : null;
}
