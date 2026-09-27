import "server-only";
import { formatShowdown, parseShowdown } from "@/core/pokedex/showdown";
import { fail } from "@/core/result";
import { addSetsToBox, getTeamSets } from "@/features/team";

/** Casos de uso de Showdown: traduce entre texto y el equipo (vía la API pública de team). */

export async function exportTeam(position?: number): Promise<string> {
  const text = formatShowdown(await getTeamSets(position));
  if (!text) fail("NOT_FOUND", position === undefined ? "El equipo está vacío." : "Ese slot está vacío.");
  return text;
}

/** Máximo de Pokémon por importación a la caja. */
const IMPORT_LIMIT = 60;

/** Importa un texto de Showdown directo a la caja (el equipo no se toca). */
export async function importToBox(text: string): Promise<{ imported: number; warnings: string[] }> {
  const { sets, warnings } = parseShowdown(text, IMPORT_LIMIT);
  if (!sets.length) fail("INVALID", warnings.join(" · ") || "No se encontró ningún Pokémon.");
  await addSetsToBox(sets);
  return { imported: sets.length, warnings };
}
