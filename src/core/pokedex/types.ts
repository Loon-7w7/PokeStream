// Tipos neutros de la Pokédex. Puros: los usan servidor, cliente y dominio.
// Todo nombre de especie/movimiento/objeto/habilidad/naturaleza viaja como ID de Showdown
// (ej. "charizardmegax", "heavydutyboots"). Los nombres legibles se resuelven al mostrar.

export type StatID = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
export type StatsTable = Record<StatID, number>;
export type Gender = "" | "M" | "F";

/** Lo que el dominio necesita saber de una especie (sin depender de @pkmn). */
export interface SpeciesInfo {
  id: string;
  name: string;
  abilityIds: string[];
  defaultAbilityId: string;
}

/** Un set de Pokémon en formato neutro (equivale a un bloque de Showdown, con IDs). */
export interface PokemonSetData {
  species: string;
  nickname: string;
  ability: string;
  item: string;
  nature: string;
  teraType: string;
  gender: Gender;
  shiny: boolean;
  moves: string[];
  evs: StatsTable | null;
  ivs: StatsTable | null;
}

/** Índice ligero que el panel descarga una vez (/api/dex). */
export interface DexIndex {
  species: DexSpecies[];
  moves: DexEntry[];
  items: DexEntry[];
  abilities: DexEntry[];
  natures: DexEntry[];
  types: string[];
}
export interface DexEntry {
  id: string;
  name: string;
}
export interface DexSpecies extends DexEntry {
  num: number;
  spriteId: string;
  types: string[];
  abilities: string[];
}

/** Nombres legibles de un set, para mostrar. */
export interface SetDisplay {
  speciesName: string;
  spriteId: string;
  types: string[];
  abilityName: string;
  itemName: string;
  natureName: string;
  moveNames: string[];
  evos: DexEntry[];
}
