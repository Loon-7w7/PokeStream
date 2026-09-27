import "server-only";
import { z } from "zod";
import { DEFAULT_SPRITES_BASE_URL } from "../pokedex/sprites";

/**
 * Única fuente de variables de entorno. Se valida al arrancar: si algo está mal,
 * el servidor falla con un mensaje claro en lugar de romperse en mitad de un directo.
 * Regla: no leer `process.env` en ningún otro archivo (excepción: src/proxy.ts).
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_NAME: z.string().trim().min(1).default("PartyHUD"),
  /** URL pública sin "/" final. De ella sale la URL de redirección de Google. */
  APP_URL: z.url().default("http://localhost:3000").transform((url) => url.replace(/\/+$/, "")),
  GOOGLE_CLIENT_ID: z.string().trim().default(""),
  GOOGLE_CLIENT_SECRET: z.string().trim().default(""),
  SESSION_SECRET: z.string().default(""),
  /** Correos que pueden entrar al panel, separados por comas. */
  ALLOWED_EMAILS: z
    .string()
    .default("")
    .transform((list) =>
      list
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  DATABASE_URL: z.string().min(1).default("file:./data/app.db"),
  SPRITES_BASE_URL: z.url().default(DEFAULT_SPRITES_BASE_URL),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Variables de entorno inválidas:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;

// Login con Google: se activa con GOOGLE_CLIENT_ID; entonces lo demás es obligatorio.
if (env.GOOGLE_CLIENT_ID) {
  const missing = [
    !env.GOOGLE_CLIENT_SECRET && "GOOGLE_CLIENT_SECRET",
    env.SESSION_SECRET.length < 32 && "SESSION_SECRET (mínimo 32 caracteres)",
    env.ALLOWED_EMAILS.length === 0 && "ALLOWED_EMAILS",
  ].filter(Boolean);
  if (missing.length) throw new Error(`Login con Google incompleto. Falta: ${missing.join(", ")}`);
} else if (env.NODE_ENV === "production") {
  console.warn("[env] GOOGLE_CLIENT_ID vacío: el panel no pide login. Úsalo solo en tu red local.");
}
