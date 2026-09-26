// Acceso a datos Pokémon con @pkmn/dex. SOLO servidor (el paquete es pesado).
// El cliente usa el índice ligero de /api/dex.
import { Dex } from "@pkmn/dex";
import { toSpriteId } from "./sprites";
import type { DexIndex, SlotData, SlotView } from "./types";

type Species = ReturnType<typeof Dex.species.get>;

// Se excluyen Pokémon inventados (CAP) y custom.
const ALLOWED = new Set([undefined, null, "Past", "Future", "LGPE", "Unobtainable", "Gigantamax"]);

export function getSpecies(nameOrId: string): Species | undefined {
  if (!nameOrId) return undefined;
  const s = Dex.species.get(nameOrId);
  return s?.exists && ALLOWED.has(s.isNonstandard as never) ? s : undefined;
}

export const spriteIdOf = (s: Species) => toSpriteId(s.baseSpecies, s.name, s.forme);

/** PS máximos con 31 IVs y 0 EVs (fórmula Gen 3+). Shedinja siempre 1. */
export function calcMaxHp(s: Species, level: number): number {
  if (s.baseStats.hp === 1) return 1;
  return Math.floor(((2 * s.baseStats.hp + 31) * level) / 100) + level + 10;
}

const nameOf = {
  ability: (id: string) => (id ? Dex.abilities.get(id).name || id : ""),
  item: (id: string) => (id ? Dex.items.get(id).name || id : ""),
  move: (id: string) => Dex.moves.get(id).name || id,
  nature: (id: string) => (id ? Dex.natures.get(id).name || id : ""),
};

/** Convierte un nombre legible o ID a ID válido; "" si no existe. */
export function resolveId(kind: "ability" | "item" | "move" | "nature", value: string): string {
  if (!value) return "";
  const table = { ability: Dex.abilities, item: Dex.items, move: Dex.moves, nature: Dex.natures }[kind];
  const e = table.get(value);
  return e?.exists ? e.id : "";
}

export function resolveType(value: string): string {
  const t = value ? Dex.types.get(value) : undefined;
  return t?.exists ? t.name : "";
}

export function toSlotView(slot: SlotData): SlotView {
  const s = getSpecies(slot.species);
  return {
    ...slot,
    speciesName: s?.name ?? "",
    spriteId: s ? spriteIdOf(s) : "",
    types: s ? [...s.types] : [],
    abilityName: nameOf.ability(slot.ability),
    itemName: nameOf.item(slot.item),
    natureName: nameOf.nature(slot.nature),
    moveNames: slot.moves.map(nameOf.move),
    evos: (s?.evos ?? [])
      .map((n) => getSpecies(n))
      .filter((e): e is Species => !!e)
      .map((e) => ({ id: e.id, name: e.name })),
  };
}

/** Valores por defecto al poner una especie nueva en un slot. */
export function speciesDefaults(speciesId: string, level: number) {
  const s = getSpecies(speciesId);
  if (!s) return null;
  const hpMax = calcMaxHp(s, level);
  return { species: s.id, ability: resolveId("ability", s.abilities["0"]), hpMax, hpCurrent: hpMax };
}

let cachedIndex: DexIndex | null = null;

/** Índice ligero para búsqueda/autocompletado en el panel. */
export function buildDexIndex(): DexIndex {
  if (cachedIndex) return cachedIndex;
  const std = <T extends { exists: boolean; isNonstandard?: string | null }>(e: T) =>
    e.exists && ALLOWED.has(e.isNonstandard as never);
  const entry = (e: { id: string; name: string }) => ({ id: e.id, name: e.name });
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

  cachedIndex = {
    species: Dex.species
      .all()
      .filter(std)
      .map((s) => ({
        id: s.id,
        name: s.name,
        num: s.num,
        spriteId: spriteIdOf(s),
        types: [...s.types],
        abilities: Object.values(s.abilities).filter(Boolean) as string[],
      }))
      .sort((a, b) => a.num - b.num || a.name.localeCompare(b.name)),
    moves: Dex.moves.all().filter(std).map(entry).sort(byName),
    items: Dex.items.all().filter(std).map(entry).sort(byName),
    abilities: Dex.abilities.all().filter(std).map(entry).sort(byName),
    natures: Dex.natures.all().map(entry).sort(byName),
    types: Dex.types.all().filter((t) => t.exists).map((t) => t.name),
  };
  return cachedIndex;
}
