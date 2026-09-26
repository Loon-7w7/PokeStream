// Reglas de negocio de un slot. DOMINIO PURO: sin BD, sin Next, sin React, sin @pkmn.
// Recibe lo que necesita (SpeciesInfo) y devuelve el slot nuevo + la línea de historial.
import type { SpeciesInfo } from "@/core/pokedex/types";
import { fail } from "@/core/result";
import { TEAM_SIZE, type SlotData, type SlotPatch } from "../types";

export const DEFAULT_LEVEL = 50;

export const emptySlot = (position: number): SlotData => ({
  position,
  species: "",
  nickname: "",
  level: DEFAULT_LEVEL,
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

export interface Change {
  slot: SlotData;
  message: string;
}

export const clampLevel = (n: number) => Math.min(100, Math.max(1, Math.round(n) || 1));

/** Nombre para mostrar en el historial: mote o especie. */
export const slotLabel = (slot: SlotData, speciesName: string) => slot.nickname || speciesName || `Slot ${slot.position + 1}`;

/** Reemplazo rápido: especie nueva, datos reiniciados, conserva el nivel si había Pokémon. */
export function placeSpecies(prev: SlotData, species: SpeciesInfo, prevName: string): Change {
  const slot: SlotData = {
    ...emptySlot(prev.position),
    species: species.id,
    level: prev.species ? prev.level : DEFAULT_LEVEL,
    ability: species.defaultAbilityId,
  };
  const message = prev.species
    ? `${species.name} reemplazó a ${slotLabel(prev, prevName)} (slot ${prev.position + 1})`
    : `${species.name} entró al slot ${prev.position + 1}`;
  return { slot, message };
}

/** Evolución: conserva mote, nivel, objeto, movimientos y estado debilitado. */
export function evolve(prev: SlotData, target: SpeciesInfo, prevName: string): Change {
  if (!prev.species) fail("INVALID", "El slot está vacío");
  const ability = target.abilityIds.includes(prev.ability) ? prev.ability : target.defaultAbilityId;
  return {
    slot: { ...prev, species: target.id, ability },
    message: `${slotLabel(prev, prevName)} evolucionó a ${target.name}`,
  };
}

/** Reglas de la run que afectan a la edición de un slot. */
export interface SlotRules {
  /** Nuzlocke: un Pokémon debilitado está muerto y no puede volver al combate. */
  nuzlocke: boolean;
}

/** Edición de campos. En Nuzlocke no se puede desmarcar "debilitado". */
export function applyPatch(prev: SlotData, patch: SlotPatch, speciesName: string, rules: SlotRules): Change {
  if (!prev.species) fail("INVALID", "El slot está vacío");
  if (rules.nuzlocke && prev.fainted && patch.fainted === false) {
    fail("INVALID", "Modo Nuzlocke: un Pokémon debilitado no puede revivir");
  }
  const next: SlotData = { ...prev, ...patch, moves: (patch.moves ?? prev.moves).slice(0, 4) };
  if (patch.level !== undefined) next.level = clampLevel(patch.level);

  const name = slotLabel(next, speciesName);
  let message = `${name} editado`;
  if (next.fainted !== prev.fainted) {
    message = next.fainted ? `${name} ${rules.nuzlocke ? "murió (Nuzlocke)" : "se debilitó"}` : `${name} volvió al combate`;
  } else if (next.level !== prev.level) message = `${name} subió a Nv. ${next.level}`;
  return { slot: next, message };
}

/** order[i] = posición anterior del slot que queda en i. Debe ser una permutación de 0..5. */
export function validateOrder(order: number[]): number[] {
  const ok = order.length === TEAM_SIZE && new Set(order).size === TEAM_SIZE && order.every((p) => p >= 0 && p < TEAM_SIZE);
  if (!ok) fail("INVALID", "Orden de equipo inválido");
  return order;
}
