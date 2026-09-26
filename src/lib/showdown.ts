// Exportar/importar equipos en formato de texto de Pokémon Showdown. SOLO servidor.
import { Sets, Teams } from "@pkmn/sets";
import type { PokemonSet } from "@pkmn/sets";
import { calcMaxHp, getSpecies, resolveId, resolveType, toSlotView } from "./dex";
import type { SlotData, StatsTable } from "./types";

export function slotToSet(slot: SlotData): Partial<PokemonSet> | null {
  const v = toSlotView(slot);
  if (!v.speciesName) return null;
  const set: Partial<PokemonSet> = {
    name: slot.nickname || undefined,
    species: v.speciesName,
    item: v.itemName || undefined,
    ability: v.abilityName || undefined,
    level: slot.level !== 100 ? slot.level : undefined,
    gender: slot.gender || undefined,
    shiny: slot.shiny || undefined,
    teraType: slot.teraType || undefined,
    nature: v.natureName || undefined,
    moves: v.moveNames,
  };
  if (slot.evs) set.evs = slot.evs;
  if (slot.ivs) set.ivs = slot.ivs;
  return set;
}

export function exportSlots(slots: SlotData[]): string {
  return slots
    .map(slotToSet)
    .filter((s): s is Partial<PokemonSet> => !!s)
    .map((s) => Sets.exportSet(s).trim())
    .join("\n\n");
}

const EMPTY_EV: StatsTable = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
const MAX_IV: StatsTable = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
const isDefault = (t: StatsTable | undefined, v: number) =>
  !t || Object.values(t).every((n) => n === v);

export type ImportResult = { slots: Omit<SlotData, "position">[]; warnings: string[] };

/** Convierte un texto de Showdown en hasta 6 slots. Especies desconocidas se omiten con aviso. */
export function importTeam(text: string): ImportResult {
  const warnings: string[] = [];
  const team = Teams.importTeam(text);
  const sets = team?.team ?? [];
  const slots: ImportResult["slots"] = [];

  for (const set of sets) {
    if (slots.length >= 6) {
      warnings.push("Solo se importan los primeros 6 Pokémon.");
      break;
    }
    const s = getSpecies(set.species ?? "");
    if (!s) {
      warnings.push(`Especie desconocida: "${set.species}"`);
      continue;
    }
    const level = clampLevel(set.level ?? 100);
    const hpMax = calcMaxHp(s, level);
    const unknown = (kind: string, v?: string) => v && warnings.push(`${kind} desconocido en ${s.name}: "${v}"`);

    const ability = resolveId("ability", set.ability ?? "") || resolveId("ability", s.abilities["0"]);
    const item = resolveId("item", set.item ?? "");
    if (set.item && !item) unknown("Objeto", set.item);
    const nature = resolveId("nature", set.nature ?? "");
    const moves = (set.moves ?? [])
      .map((m) => {
        const id = resolveId("move", m);
        if (!id) unknown("Movimiento", m);
        return id;
      })
      .filter(Boolean)
      .slice(0, 4);

    slots.push({
      species: s.id,
      nickname: set.name && set.name !== s.name ? set.name.slice(0, 24) : "",
      level,
      hpMax,
      hpCurrent: hpMax,
      ability,
      item,
      nature,
      teraType: resolveType(set.teraType ?? ""),
      gender: set.gender === "M" || set.gender === "F" ? set.gender : "",
      shiny: !!set.shiny,
      fainted: false,
      moves,
      evs: isDefault(set.evs as StatsTable, 0) ? null : { ...EMPTY_EV, ...set.evs },
      ivs: isDefault(set.ivs as StatsTable, 31) ? null : { ...MAX_IV, ...set.ivs },
    });
  }
  if (!sets.length) warnings.push("No se encontró ningún Pokémon en el texto.");
  return { slots, warnings };
}

export const clampLevel = (n: number) => Math.min(100, Math.max(1, Math.round(n) || 1));
