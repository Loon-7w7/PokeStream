import "server-only";
import { headers } from "next/headers";

/**
 * Clave para limitar envíos del formulario público: la IP del visitante.
 * Detrás de Cloudflare Tunnel llega en `cf-connecting-ip`; si no, en el primer salto de `x-forwarded-for`.
 * Sin proxy delante estas cabeceras se pueden falsear: el límite es una defensa básica, no una garantía.
 */
export async function getClientKey(): Promise<string> {
  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0];
  return ip?.trim() || "unknown";
}
