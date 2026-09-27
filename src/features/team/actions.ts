"use server";
import { z } from "zod";
import { runAction } from "@/core/action";
import * as team from "./server/team.service";

/** Server actions de team: validar entrada -> caso de uso -> ActionResult. Sin lógica. */

const Position = z.number().int().min(0).max(5);
const Id = z.string().trim().min(1).max(64);
const Stats = z.object({ hp: z.number(), atk: z.number(), def: z.number(), spa: z.number(), spd: z.number(), spe: z.number() });
const Name = z.string().trim().max(64);

const SlotEdit = z
  .object({
    nickname: z.string().trim().max(24),
    ability: Name,
    item: Name,
    nature: Name,
    teraType: Name,
    gender: z.enum(["", "M", "F"]),
    shiny: z.boolean(),
    fainted: z.boolean(),
    moves: z.array(Name).max(4),
    evs: Stats.nullable(),
    ivs: Stats.nullable(),
  })
  .partial()
  .strict();

const opts = { refresh: true };

export async function replaceSpecies(position: number, speciesId: string) {
  return runAction(() => team.replaceSpecies(Position.parse(position), Id.parse(speciesId)), opts);
}

export async function evolveSlot(position: number, speciesId: string) {
  return runAction(() => team.evolveSlot(Position.parse(position), Id.parse(speciesId)), opts);
}

export async function updateSlot(position: number, input: z.input<typeof SlotEdit>) {
  return runAction(() => team.updateSlot(Position.parse(position), SlotEdit.parse(input)), opts);
}

export async function clearSlot(position: number) {
  return runAction(() => team.clearSlot(Position.parse(position)), opts);
}

export async function withdrawFromBox(index: number, position: number) {
  return runAction(() => team.withdrawFromBox(z.number().int().min(0).parse(index), Position.parse(position)), opts);
}

export async function releaseStored(list: "box" | "graveyard", index: number) {
  return runAction(() => team.releaseStored(z.enum(["box", "graveyard"]).parse(list), z.number().int().min(0).parse(index)), opts);
}

export async function reorderTeam(order: number[]) {
  return runAction(() => team.reorderTeam(z.array(Position).length(6).parse(order)), opts);
}
