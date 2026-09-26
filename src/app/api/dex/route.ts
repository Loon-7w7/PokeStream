// Índice ligero de la Pokédex para búsqueda y autocompletado en el panel.
// Se genera en el build (estático) y el navegador lo cachea.
import { buildDexIndex } from "@/lib/dex";

export const dynamic = "force-static";

export function GET() {
  return Response.json(buildDexIndex(), {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
