import "server-only";
import { describeSet, getSpeciesInfo, resolveId, resolveType } from "@/core/pokedex/server";
import type { PokemonSetData, SpeciesInfo } from "@/core/pokedex/types";
import { fail } from "@/core/result";
import { getCurrentRun, mutateRun, type MutationContext } from "@/features/run";
import * as domain from "../domain/slot";
import * as box from "../domain/storage";
import { TEAM_SIZE, type SlotData, type SlotPatch, type SlotView, type StorageView } from "../types";
import * as slots from "./slot.repository";
import * as storage from "./storage.repository";

/** Casos de uso de team: orquestan pokedex + dominio + repositorio dentro de mutateRun. */

const toView = (slot: SlotData): SlotView => ({ ...slot, ...describeSet(slot) });

function requireSpecies(id: string): SpeciesInfo {
  return getSpeciesInfo(id) ?? fail("NOT_FOUND", `Pokémon desconocido: "${id}"`);
}

// ---------- Lecturas ----------

/** Caja y Muertos con lo mínimo para pintar el sprite. */
export async function getStorageView(): Promise<StorageView> {
  const run = await getCurrentRun();
  const { box: boxed, graveyard } = await storage.getStorage(run.id);
  const view = (list: PokemonSetData[]) =>
    list.map((set, index) => {
      const d = describeSet(set);
      return { index, speciesName: d.speciesName, spriteId: d.spriteId, nickname: set.nickname, shiny: set.shiny };
    });
  return { box: view(boxed), graveyard: view(graveyard) };
}

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

type Ctx = MutationContext;

/** Manda a la caja (o a Muertos) a los Pokémon que salen del equipo. */
async function stashLeaving({ db, runId, nuzlocke }: Ctx, leaving: SlotData[]) {
  if (!leaving.some((s) => s.species)) return;
  await storage.saveStorage(runId, box.stash(await storage.getStorage(runId, db), leaving, { nuzlocke }), db);
}

export const replaceSpecies = (position: number, speciesId: string) =>
  mutateRun(async (ctx) => {
    const prev = await slots.findSlot(ctx.runId, position, ctx.db);
    const species = requireSpecies(speciesId);
    await stashLeaving(ctx, [prev]);
    await slots.saveSlot(ctx.runId, domain.placeSpecies(prev, species), ctx.db);
  });

export const evolveSlot = (position: number, speciesId: string) =>
  mutateRun(async ({ db, runId }) => {
    const prev = await slots.findSlot(runId, position, db);
    await slots.saveSlot(runId, domain.evolve(prev, requireSpecies(speciesId)), db);
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
  mutateRun(async ({ db, runId, nuzlocke }) => {
    const prev = await slots.findSlot(runId, position, db);
    await slots.saveSlot(runId, domain.applyPatch(prev, resolvePatch(input), { nuzlocke }), db);
  });

export const clearSlot = (position: number) =>
  mutateRun(async (ctx) => {
    const prev = await slots.findSlot(ctx.runId, position, ctx.db);
    await stashLeaving(ctx, [prev]);
    await slots.saveSlot(ctx.runId, domain.emptySlot(position), ctx.db);
  });

export const reorderTeam = (order: number[]) =>
  mutateRun(async ({ db, runId }) => {
    await slots.reorderSlots(runId, domain.validateOrder(order), db);
  });

/** Reemplaza los 6 slots con sets importados (los que falten quedan vacíos). El equipo anterior va a la caja. */
export const replaceTeam = (sets: PokemonSetData[]) =>
  mutateRun(async (ctx) => {
    await stashLeaving(ctx, await slots.listSlots(ctx.runId, ctx.db));
    for (let position = 0; position < TEAM_SIZE; position++) {
      const set = sets[position];
      const slot = set && getSpeciesInfo(set.species) ? domain.placeSet(set, position) : domain.emptySlot(position);
      await slots.saveSlot(ctx.runId, slot, ctx.db);
    }
  });

/** Caja -> equipo: el Pokémon entra al slot y el que estaba ahí va a la caja (o a Muertos). */
export const withdrawFromBox = (index: number, position: number) =>
  mutateRun(async ({ db, runId, nuzlocke }) => {
    const prev = await slots.findSlot(runId, position, db);
    const taken = box.takeFromBox(await storage.getStorage(runId, db), index);
    await storage.saveStorage(runId, box.stash(taken.storage, [prev], { nuzlocke }), db);
    await slots.saveSlot(runId, domain.placeSet(taken.set, position), db);
  });

/** Borra definitivamente un Pokémon de la caja o de Muertos. */
export const releaseStored = (list: "box" | "graveyard", index: number) =>
  mutateRun(async ({ db, runId }) => {
    await storage.saveStorage(runId, box.removeStored(await storage.getStorage(runId, db), list, index), db);
  });
