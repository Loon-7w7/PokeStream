import "server-only";
import { Sets, Teams } from "@pkmn/sets";
import type { PokemonSet } from "@pkmn/sets";
import { describeSet, getSpeciesInfo, resolveId, resolveType } from "./server";
import type { PokemonSetData, StatsTable } from "./types";

/** Códec del formato de texto de Pokémon Showdown <-> PokemonSetData (con IDs). */

export function formatShowdown(sets: PokemonSetData[]): string {
  return sets
    .map((set) => {
      const d = describeSet(set);
      if (!d.speciesName) return "";
      const out: Partial<PokemonSet> = {
        name: set.nickname || undefined,
        species: d.speciesName,
        item: d.itemName || undefined,
        ability: d.abilityName || undefined,
        level: set.level !== 100 ? set.level : undefined,
        gender: set.gender || undefined,
        shiny: set.shiny || undefined,
        teraType: set.teraType || undefined,
        nature: d.natureName || undefined,
        moves: d.moveNames,
        evs: set.evs ?? undefined,
        ivs: set.ivs ?? undefined,
      };
      return Sets.exportSet(out).trim();
    })
    .filter(Boolean)
    .join("\n\n");
}

const ZERO: StatsTable = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
const MAX_IV: StatsTable = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
const allEqual = (t: Partial<StatsTable> | undefined, v: number) => !t || Object.values(t).every((n) => n === v);
const clampLevel = (n: number) => Math.min(100, Math.max(1, Math.round(n) || 1));

export interface ParseResult {
  sets: PokemonSetData[];
  warnings: string[];
}

/** Lee un texto de Showdown. Lo desconocido se descarta con un aviso en español. */
export function parseShowdown(text: string, max = 6): ParseResult {
  const warnings: string[] = [];
  const raw = Teams.importTeam(text)?.team ?? [];
  const sets: PokemonSetData[] = [];

  for (const r of raw) {
    if (sets.length >= max) {
      warnings.push(`Solo se importan los primeros ${max} Pokémon.`);
      break;
    }
    const species = getSpeciesInfo(r.species ?? "");
    if (!species) {
      warnings.push(`Especie desconocida: "${r.species}"`);
      continue;
    }
    const unknown = (what: string, v: string) => warnings.push(`${what} desconocido en ${species.name}: "${v}"`);
    const item = resolveId("item", r.item ?? "");
    if (r.item && !item) unknown("Objeto", r.item);
    const moves = (r.moves ?? []).flatMap((m) => {
      const id = resolveId("move", m);
      if (!id) unknown("Movimiento", m);
      return id ? [id] : [];
    });

    sets.push({
      species: species.id,
      nickname: r.name && r.name !== species.name ? r.name.slice(0, 24) : "",
      level: clampLevel(r.level ?? 100),
      ability: resolveId("ability", r.ability ?? "") || species.defaultAbilityId,
      item,
      nature: resolveId("nature", r.nature ?? ""),
      teraType: resolveType(r.teraType ?? ""),
      gender: r.gender === "M" || r.gender === "F" ? r.gender : "",
      shiny: !!r.shiny,
      moves: moves.slice(0, 4),
      evs: allEqual(r.evs, 0) ? null : { ...ZERO, ...r.evs },
      ivs: allEqual(r.ivs, 31) ? null : { ...MAX_IV, ...r.ivs },
    });
  }
  if (!raw.length) warnings.push("No se encontró ningún Pokémon en el texto.");
  return { sets, warnings };
}
