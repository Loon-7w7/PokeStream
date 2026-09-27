import "server-only";
import { formatShowdown, parseShowdown } from "@/core/pokedex/showdown";
import { fail } from "@/core/result";
import { getTeamSets, replaceTeam } from "@/features/team";

/** Casos de uso de Showdown: traduce entre texto y el equipo (vía la API pública de team). */

export async function exportTeam(position?: number): Promise<string> {
  const text = formatShowdown(await getTeamSets(position));
  if (!text) fail("NOT_FOUND", position === undefined ? "El equipo está vacío." : "Ese slot está vacío.");
  return text;
}

export async function importTeam(text: string): Promise<{ imported: number; warnings: string[] }> {
  const { sets, warnings } = parseShowdown(text);
  if (!sets.length) fail("INVALID", warnings.join(" · ") || "No se encontró ningún Pokémon.");
  await replaceTeam(sets);
  return { imported: sets.length, warnings };
}
