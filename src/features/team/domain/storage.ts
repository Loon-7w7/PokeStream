// Reglas de la caja y de los muertos. DOMINIO PURO.
import type { PokemonSetData } from "@/core/pokedex/types";
import { fail } from "@/core/result";
import type { SlotData, StoredSets } from "../types";
import { destinationOf, toSet, type SlotRules } from "./slot";

/** Guarda en la caja (o en Muertos) a los Pokémon que salen del equipo. Los slots vacíos se ignoran. */
export function stash(storage: StoredSets, leaving: SlotData[], rules: SlotRules): StoredSets {
  const next = { box: [...storage.box], graveyard: [...storage.graveyard] };
  for (const slot of leaving) if (slot.species) next[destinationOf(slot, rules)].push(toSet(slot));
  return next;
}

/** Tope de la caja para lo que se añade a mano o importado (evita que el texto crezca sin límite). */
export const BOX_LIMIT = 500;

/** Mete Pokémon directamente en la caja (importados o elegidos a mano). */
export function addToBox(storage: StoredSets, sets: PokemonSetData[]): StoredSets {
  if (storage.box.length + sets.length > BOX_LIMIT) fail("CONFLICT", `La caja está llena (máximo ${BOX_LIMIT} Pokémon).`);
  return { ...storage, box: [...storage.box, ...sets] };
}

/** Saca un Pokémon de la caja. */
export function takeFromBox(storage: StoredSets, index: number): { set: PokemonSetData; storage: StoredSets } {
  const set = storage.box[index] ?? fail("NOT_FOUND", "Ese Pokémon ya no está en la caja");
  return { set, storage: { ...storage, box: storage.box.filter((_, i) => i !== index) } };
}

/** Muertes de la partida: los de Muertos más los debilitados que siguen en el equipo. */
export const countDeaths = (team: SlotData[], storage: StoredSets): number =>
  storage.graveyard.length + team.filter((s) => s.species && s.fainted).length;

/** Borra una entrada de la caja o de Muertos. */
export function removeStored(storage: StoredSets, list: keyof StoredSets, index: number): StoredSets {
  if (!storage[list][index]) fail("NOT_FOUND", "Ese Pokémon ya no está guardado");
  return { ...storage, [list]: storage[list].filter((_, i) => i !== index) };
}
