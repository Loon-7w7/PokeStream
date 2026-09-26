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
  ADMIN_TOKEN: z.string().default(""),
  DATABASE_URL: z.string().min(1).default("file:./data/app.db"),
  SPRITES_BASE_URL: z.url().default(DEFAULT_SPRITES_BASE_URL),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Variables de entorno inválidas:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;

if (env.NODE_ENV === "production" && !env.ADMIN_TOKEN) {
  console.warn("[env] ADMIN_TOKEN vacío: el panel no pide contraseña. Úsalo solo en tu red local.");
}
