// Reglas de negocio de un slot. DOMINIO PURO: sin BD, sin Next, sin React, sin @pkmn.
// Recibe lo que necesita (SpeciesInfo, reglas de la run) y devuelve el slot nuevo.
import type { PokemonSetData, SpeciesInfo } from "@/core/pokedex/types";
import { fail } from "@/core/result";
import { TEAM_SIZE, type SlotData, type SlotPatch } from "../types";

export const emptySlot = (position: number): SlotData => ({
  position,
  species: "",
  nickname: "",
  ability: "",
  item: "",
  nature: "",
  teraType: "",
  gender: "",
  shiny: false,
  fainted: false,
  moves: [],
  evs: null,
  ivs: null,
});

/** Reglas de la run que afectan al equipo. */
export interface SlotRules {
  /** Nuzlocke: un Pokémon debilitado está muerto y no puede volver al combate. */
  nuzlocke: boolean;
}

/** Reemplazo rápido: especie nueva con datos reiniciados. */
export function placeSpecies(prev: SlotData, species: SpeciesInfo): SlotData {
  return { ...emptySlot(prev.position), species: species.id, ability: species.defaultAbilityId };
}

/** Coloca un set guardado (caja) en un slot, vivo. */
export const placeSet = (set: PokemonSetData, position: number): SlotData => ({ ...set, position, fainted: false });

/** Evolución: conserva mote, objeto, movimientos y estado debilitado. */
export function evolve(prev: SlotData, target: SpeciesInfo): SlotData {
  if (!prev.species) fail("INVALID", "El slot está vacío");
  const ability = target.abilityIds.includes(prev.ability) ? prev.ability : target.defaultAbilityId;
  return { ...prev, species: target.id, ability };
}

/** Edición de campos. En Nuzlocke no se puede desmarcar "debilitado". */
export function applyPatch(prev: SlotData, patch: SlotPatch, rules: SlotRules): SlotData {
  if (!prev.species) fail("INVALID", "El slot está vacío");
  if (rules.nuzlocke && prev.fainted && patch.fainted === false) {
    fail("INVALID", "Modo Nuzlocke: un Pokémon debilitado no puede revivir");
  }
  return { ...prev, ...patch, moves: (patch.moves ?? prev.moves).slice(0, 4) };
}

/** A dónde va un Pokémon que sale del equipo: a Muertos si murió en Nuzlocke; si no, a la caja. */
export const destinationOf = (slot: SlotData, rules: SlotRules): "box" | "graveyard" =>
  rules.nuzlocke && slot.fainted ? "graveyard" : "box";

/** Set sin datos del equipo (posición, debilitado), listo para guardar. */
export function toSet(slot: SlotData): PokemonSetData {
  const { position: _position, fainted: _fainted, ...set } = slot;
  return set;
}

/** order[i] = posición anterior del slot que queda en i. Debe ser una permutación de 0..5. */
export function validateOrder(order: number[]): number[] {
  const ok = order.length === TEAM_SIZE && new Set(order).size === TEAM_SIZE && order.every((p) => p >= 0 && p < TEAM_SIZE);
  if (!ok) fail("INVALID", "Orden de equipo inválido");
  return order;
}
