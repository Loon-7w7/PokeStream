// Tipos públicos de la feature team. Puros.
import type { PokemonSetData, SetDisplay } from "@/core/pokedex/types";

/** Un slot del equipo (0-5). species = "" significa vacío. Todo nombre va como ID. */
export interface SlotData extends PokemonSetData {
  position: number;
  fainted: boolean;
}

/** Slot + nombres legibles para mostrar. */
export type SlotView = SlotData & SetDisplay;

/** Cambios editables de un slot (IDs ya resueltos). */
export type SlotPatch = Partial<Omit<SlotData, "position" | "species">>;

export const TEAM_SIZE = 6;

/** Pokémon fuera del equipo: la caja y los muertos del Nuzlocke. */
export interface StoredSets {
  box: PokemonSetData[];
  graveyard: PokemonSetData[];
}

/** Un Pokémon guardado, listo para mostrar. `index` es su posición en la lista. */
export interface StoredView {
  index: number;
  speciesName: string;
  nickname: string;
  spriteId: string;
  shiny: boolean;
}

export interface StorageView {
  box: StoredView[];
  graveyard: StoredView[];
}
