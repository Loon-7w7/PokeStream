// Índice ligero de la Pokédex para el panel. Estático: se genera en el build.
import { buildDexIndex } from "@/core/pokedex/server";

export const dynamic = "force-static";

export function GET() {
  return Response.json(buildDexIndex(), { headers: { "Cache-Control": "public, max-age=86400" } });
}
