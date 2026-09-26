import "server-only";
import { describeSet, getSpeciesInfo, resolveId, resolveType } from "@/core/pokedex/server";
import type { PokemonSetData, SpeciesInfo } from "@/core/pokedex/types";
import { fail } from "@/core/result";
import { getCurrentRun, mutateRun } from "@/features/run";
import * as domain from "../domain/slot";
import { TEAM_SIZE, type SlotData, type SlotPatch, type SlotView } from "../types";
import * as slots from "./slot.repository";

/** Casos de uso de team: orquestan pokedex + dominio + repositorio dentro de mutateRun. */

const toView = (slot: SlotData): SlotView => ({ ...slot, ...describeSet(slot) });

function requireSpecies(id: string): SpeciesInfo {
  return getSpeciesInfo(id) ?? fail("NOT_FOUND", `Pokémon desconocido: "${id}"`);
}
const nameOf = (slot: SlotData) => (slot.species ? (getSpeciesInfo(slot.species)?.name ?? "") : "");

// ---------- Lecturas ----------

export async function getTeamView(): Promise<SlotView[]> {
  const run = await getCurrentRun();
  return (await slots.listSlots(run.id)).map(toView);
}

export async function getTeamByRunId(runId: string): Promise<SlotView[]> {
  return (await slots.listSlots(runId)).map(toView);
}

/** Sets en formato neutro (para exportar). */
export async function getTeamSets(position?: number): Promise<PokemonSetData[]> {
  const run = await getCurrentRun();
  return (await slots.listSlots(run.id)).filter((s) => s.species && (position === undefined || s.position === position));
}

// ---------- Mutaciones ----------

export const replaceSpecies = (position: number, speciesId: string) =>
  mutateRun(async ({ db, runId, log }) => {
    const prev = await slots.findSlot(runId, position, db);
    const change = domain.placeSpecies(prev, requireSpecies(speciesId), nameOf(prev));
    await slots.saveSlot(runId, change.slot, db);
    log(change.message);
  });

export const evolveSlot = (position: number, speciesId: string) =>
  mutateRun(async ({ db, runId, log }) => {
    const prev = await slots.findSlot(runId, position, db);
    const change = domain.evolve(prev, requireSpecies(speciesId), nameOf(prev));
    await slots.saveSlot(runId, change.slot, db);
    log(change.message);
  });

/** Entrada de edición: habilidad, objeto, etc. pueden venir como nombre legible o ID. */
export type SlotEditInput = Omit<SlotPatch, "ability" | "item" | "nature" | "moves"> & {
  ability?: string;
  item?: string;
  nature?: string;
  moves?: string[];
};

function resolvePatch(input: SlotEditInput): SlotPatch {
  const patch: SlotPatch = { ...input };
  if (input.ability !== undefined) patch.ability = resolveId("ability", input.ability);
  if (input.item !== undefined) patch.item = resolveId("item", input.item);
  if (input.nature !== undefined) patch.nature = resolveId("nature", input.nature);
  if (input.teraType !== undefined) patch.teraType = resolveType(input.teraType);
  if (input.moves !== undefined) patch.moves = input.moves.map((m) => resolveId("move", m)).filter(Boolean);
  return patch;
}

export const updateSlot = (position: number, input: SlotEditInput) =>
  mutateRun(async ({ db, runId, log }) => {
    const prev = await slots.findSlot(runId, position, db);
    if (!prev.species) fail("INVALID", "El slot está vacío");
    const change = domain.applyPatch(prev, resolvePatch(input), requireSpecies(prev.species));
    await slots.saveSlot(runId, change.slot, db);
    log(change.message);
  });

export const adjustHp = (position: number, delta: number) =>
  mutateRun(async ({ db, runId, log }) => {
    const prev = await slots.findSlot(runId, position, db);
    if (!prev.species) fail("INVALID", "El slot está vacío");
    const change = domain.applyPatch(prev, { hpCurrent: prev.hpCurrent + delta }, requireSpecies(prev.species));
    await slots.saveSlot(runId, change.slot, db);
    log(change.message);
  });

export const clearSlot = (position: number) =>
  mutateRun(async ({ db, runId, log }) => {
    const prev = await slots.findSlot(runId, position, db);
    await slots.saveSlot(runId, domain.emptySlot(position), db);
    if (prev.species) log(`${domain.slotLabel(prev, nameOf(prev))} salió del equipo`);
  });

export const reorderTeam = (order: number[]) =>
  mutateRun(async ({ db, runId, log }) => {
    await slots.reorderSlots(runId, domain.validateOrder(order), db);
    log("Equipo reordenado");
  });

export const healAll = () =>
  mutateRun(async ({ db, runId, log }) => {
    for (const slot of await slots.listSlots(runId, db)) await slots.saveSlot(runId, domain.heal(slot), db);
    log("Equipo curado (excepto debilitados)");
  });

/** Reemplaza los 6 slots con sets importados (los que falten quedan vacíos). */
export const replaceTeam = (sets: PokemonSetData[], message: string) =>
  mutateRun(async ({ db, runId, log }) => {
    for (let position = 0; position < TEAM_SIZE; position++) {
      const set = sets[position];
      const species = set && getSpeciesInfo(set.species);
      const slot: SlotData = species
        ? { ...set, position, hpMax: domain.calcMaxHp(species.baseHp, set.level), hpCurrent: 0, fainted: false }
        : domain.emptySlot(position);
      slot.hpCurrent = slot.hpMax;
      await slots.saveSlot(runId, slot, db);
    }
    log(message);
  });
