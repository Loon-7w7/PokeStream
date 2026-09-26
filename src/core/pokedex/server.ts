import "server-only";
import { Dex } from "@pkmn/dex";
import { toSpriteId } from "./sprites";
import type { DexIndex, SetDisplay, SpeciesInfo } from "./types";

/**
 * Capa anticorrupción sobre @pkmn/dex. Es el ÚNICO lugar (junto con showdown.ts)
 * que conoce la librería: si mañana cambia o se reemplaza, solo se toca core/pokedex.
 */

type Species = ReturnType<typeof Dex.species.get>;

// Se excluyen Pokémon inventados (CAP) y custom.
const ALLOWED = new Set<string | undefined | null>([undefined, null, "Past", "Future", "LGPE", "Unobtainable", "Gigantamax"]);
const isAllowed = (e: { exists: boolean; isNonstandard?: string | null }) => e.exists && ALLOWED.has(e.isNonstandard);

function findSpecies(nameOrId: string): Species | undefined {
  if (!nameOrId) return undefined;
  const s = Dex.species.get(nameOrId);
  return s && isAllowed(s) ? s : undefined;
}

const spriteIdOf = (s: Species) => toSpriteId(s.baseSpecies, s.name, s.forme);

export function getSpeciesInfo(nameOrId: string): SpeciesInfo | null {
  const s = findSpecies(nameOrId);
  if (!s) return null;
  return {
    id: s.id,
    name: s.name,
    abilityIds: Object.values(s.abilities)
      .filter(Boolean)
      .map((a) => Dex.abilities.get(a as string).id),
    defaultAbilityId: Dex.abilities.get(s.abilities["0"]).id,
  };
}

type Kind = "ability" | "item" | "move" | "nature";
const tables = { ability: Dex.abilities, item: Dex.items, move: Dex.moves, nature: Dex.natures };

/** Nombre legible o ID -> ID válido. Devuelve "" si no existe. */
export function resolveId(kind: Kind, value: string): string {
  if (!value) return "";
  const e = tables[kind].get(value);
  return e?.exists ? e.id : "";
}

/** Nombre de tipo normalizado ("fire" -> "Fire"); "" si no existe. */
export function resolveType(value: string): string {
  if (!value) return "";
  const t = Dex.types.get(value);
  return t?.exists ? t.name : "";
}

const nameOf = (kind: Kind, id: string) => (id ? tables[kind].get(id).name || id : "");

/** Nombres legibles para mostrar un set. */
export function describeSet(set: { species: string; ability: string; item: string; nature: string; moves: string[] }): SetDisplay {
  const s = findSpecies(set.species);
  return {
    speciesName: s?.name ?? "",
    spriteId: s ? spriteIdOf(s) : "",
    types: s ? [...s.types] : [],
    abilityName: nameOf("ability", set.ability),
    itemName: nameOf("item", set.item),
    natureName: nameOf("nature", set.nature),
    moveNames: set.moves.map((m) => nameOf("move", m)),
    evos: (s?.evos ?? [])
      .map((n) => findSpecies(n))
      .filter((e): e is Species => !!e)
      .map((e) => ({ id: e.id, name: e.name })),
  };
}

let cachedIndex: DexIndex | null = null;

export function buildDexIndex(): DexIndex {
  if (cachedIndex) return cachedIndex;
  const entry = (e: { id: string; name: string }) => ({ id: e.id, name: e.name });
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  cachedIndex = {
    species: Dex.species
      .all()
      .filter(isAllowed)
      .map((s) => ({
        id: s.id,
        name: s.name,
        num: s.num,
        spriteId: spriteIdOf(s),
        types: [...s.types],
        abilities: Object.values(s.abilities).filter(Boolean) as string[],
      }))
      .sort((a, b) => a.num - b.num || a.name.localeCompare(b.name)),
    moves: Dex.moves.all().filter(isAllowed).map(entry).sort(byName),
    items: Dex.items.all().filter(isAllowed).map(entry).sort(byName),
    abilities: Dex.abilities.all().filter(isAllowed).map(entry).sort(byName),
    natures: Dex.natures.all().map(entry).sort(byName),
    types: Dex.types.all().filter((t) => t.exists).map((t) => t.name),
  };
  return cachedIndex;
}
