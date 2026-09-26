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
  hpCurrent: 0,
  hpMax: 0,
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

/** PS máximos con 31 IVs / 0 EVs (fórmula Gen 3+). Shedinja (base 1) siempre 1. */
export function calcMaxHp(baseHp: number, level: number): number {
  if (baseHp === 1) return 1;
  return Math.floor(((2 * baseHp + 31) * level) / 100) + level + 10;
}

export const clampLevel = (n: number) => Math.min(100, Math.max(1, Math.round(n) || 1));

/** Nombre para mostrar en el historial: mote o especie. */
export const slotLabel = (slot: SlotData, speciesName: string) => slot.nickname || speciesName || `Slot ${slot.position + 1}`;

/** Reemplazo rápido: especie nueva, datos reiniciados, conserva el nivel si había Pokémon. */
export function placeSpecies(prev: SlotData, species: SpeciesInfo, prevName: string): Change {
  const level = prev.species ? prev.level : DEFAULT_LEVEL;
  const hpMax = calcMaxHp(species.baseHp, level);
  const slot: SlotData = {
    ...emptySlot(prev.position),
    species: species.id,
    level,
    hpMax,
    hpCurrent: hpMax,
    ability: species.defaultAbilityId,
  };
  const message = prev.species
    ? `${species.name} reemplazó a ${slotLabel(prev, prevName)} (slot ${prev.position + 1})`
    : `${species.name} entró al slot ${prev.position + 1}`;
  return { slot, message };
}

/** Evolución: conserva mote, nivel, objeto y movimientos. PS escalados en proporción. */
export function evolve(prev: SlotData, target: SpeciesInfo, prevName: string): Change {
  if (!prev.species) fail("INVALID", "El slot está vacío");
  const hpMax = calcMaxHp(target.baseHp, prev.level);
  const ratio = prev.hpMax ? prev.hpCurrent / prev.hpMax : 1;
  const ability = target.abilityIds.includes(prev.ability) ? prev.ability : target.defaultAbilityId;
  return {
    slot: { ...prev, species: target.id, hpMax, hpCurrent: Math.round(hpMax * ratio), ability },
    message: `${slotLabel(prev, prevName)} evolucionó a ${target.name}`,
  };
}

/**
 * Edición de campos con las reglas de PS / debilitado / nivel:
 * - subir de nivel sin indicar PS máx. => se recalculan (y los PS actuales suben lo mismo)
 * - PS a 0 => debilitado; curar a un debilitado => revive
 * - marcar debilitado => PS a 0; desmarcarlo (corrección) => PS al máximo
 */
export function applyPatch(prev: SlotData, patch: SlotPatch, species: SpeciesInfo): Change {
  if (!prev.species) fail("INVALID", "El slot está vacío");
  const next: SlotData = { ...prev, ...patch, moves: (patch.moves ?? prev.moves).slice(0, 4) };

  if (patch.level !== undefined) next.level = clampLevel(patch.level);
  if (next.level !== prev.level && patch.hpMax === undefined) {
    next.hpMax = calcMaxHp(species.baseHp, next.level);
    if (patch.hpCurrent === undefined) next.hpCurrent = prev.hpCurrent + (next.hpMax - prev.hpMax);
  }
  next.hpMax = Math.max(1, next.hpMax);
  next.hpCurrent = Math.min(Math.max(0, next.hpCurrent), next.hpMax);

  if (patch.fainted === undefined) {
    if (next.hpCurrent === 0) next.fainted = true;
    else if (prev.fainted) next.fainted = false;
  } else if (patch.hpCurrent === undefined) {
    if (patch.fainted && !prev.fainted) next.hpCurrent = 0;
    if (!patch.fainted && prev.fainted && prev.hpCurrent === 0) next.hpCurrent = next.hpMax;
  }

  const name = slotLabel(next, species.name);
  let message = `${name} editado`;
  if (next.fainted !== prev.fainted) message = next.fainted ? `${name} se debilitó` : `${name} volvió al combate`;
  else if (next.level !== prev.level) message = `${name} subió a Nv. ${next.level}`;
  else if (next.hpCurrent !== prev.hpCurrent) message = `${name}: PS ${prev.hpCurrent} → ${next.hpCurrent}`;
  return { slot: next, message };
}

/** Curar a todos los no debilitados. */
export const heal = (slot: SlotData): SlotData =>
  slot.species && !slot.fainted ? { ...slot, hpCurrent: slot.hpMax } : slot;

/** order[i] = posición anterior del slot que queda en i. Debe ser una permutación de 0..5. */
export function validateOrder(order: number[]): number[] {
  const ok = order.length === TEAM_SIZE && new Set(order).size === TEAM_SIZE && order.every((p) => p >= 0 && p < TEAM_SIZE);
  if (!ok) fail("INVALID", "Orden de equipo inválido");
  return order;
}
