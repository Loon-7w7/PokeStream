"use server";
// Server actions del panel. Todas: validan admin -> modifican BD -> registran historial
// -> notifican al widget (SSE) -> devuelven el RunState actualizado.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE, checkToken, requireAdmin } from "@/lib/auth";
import { calcMaxHp, getSpecies, resolveId, resolveType, speciesDefaults } from "@/lib/dex";
import { publishRunChanged } from "@/lib/events";
import { EMPTY_SLOT, addHistory, getActiveRun, getRunState, newToken, rowToSlot, slotToRow } from "@/lib/run";
import { exportSlots, importTeam } from "@/lib/showdown";
import type { RunState, SlotData } from "@/lib/types";

type Ctx = { runId: string; log: (msg: string) => Promise<void> };

async function mutate(fn: (ctx: Ctx) => Promise<void>): Promise<RunState> {
  await requireAdmin();
  const run = await getActiveRun();
  await fn({ runId: run.id, log: (msg) => addHistory(run.id, msg) });
  publishRunChanged(run.id);
  return getRunState();
}

const Position = z.number().int().min(0).max(5);

async function loadSlot(runId: string, position: number) {
  const row = await prisma.slot.findUniqueOrThrow({ where: { runId_position: { runId, position } } });
  return rowToSlot(row);
}

const label = (s: SlotData) => s.nickname || getSpecies(s.species)?.name || `Slot ${s.position + 1}`;

async function saveSlot(runId: string, position: number, data: Partial<Omit<SlotData, "position">>) {
  await prisma.slot.update({ where: { runId_position: { runId, position } }, data: slotToRow(data) });
}

/** Reemplazo rápido: pone una especie nueva en el slot y reinicia sus datos. */
export async function replaceSpecies(position: number, speciesId: string) {
  Position.parse(position);
  return mutate(async ({ runId, log }) => {
    const prev = await loadSlot(runId, position);
    const level = prev.species ? prev.level : 50;
    const defaults = speciesDefaults(speciesId, level);
    if (!defaults) throw new Error("Especie no válida");
    await saveSlot(runId, position, { ...EMPTY_SLOT, ...defaults, level });
    const name = getSpecies(speciesId)!.name;
    await log(prev.species ? `${name} reemplazó a ${label(prev)} (slot ${position + 1})` : `${name} entró al slot ${position + 1}`);
  });
}

/** Evoluciona conservando mote, nivel, movimientos y objeto. PS se escala proporcionalmente. */
export async function evolveSlot(position: number, speciesId: string) {
  Position.parse(position);
  return mutate(async ({ runId, log }) => {
    const prev = await loadSlot(runId, position);
    const s = getSpecies(speciesId);
    if (!s || !prev.species) throw new Error("Evolución no válida");
    const hpMax = calcMaxHp(s, prev.level);
    const ratio = prev.hpMax ? prev.hpCurrent / prev.hpMax : 1;
    const abilityIds = Object.values(s.abilities).map((a) => resolveId("ability", a as string));
    const ability = abilityIds.includes(prev.ability) ? prev.ability : resolveId("ability", s.abilities["0"]);
    await saveSlot(runId, position, { species: s.id, hpMax, hpCurrent: Math.round(hpMax * ratio), ability });
    await log(`${label(prev)} evolucionó a ${s.name}`);
  });
}

const Stats = z.object({ hp: z.number(), atk: z.number(), def: z.number(), spa: z.number(), spd: z.number(), spe: z.number() });
const SlotPatch = z
  .object({
    nickname: z.string().max(24),
    level: z.number().int().min(1).max(100),
    hpCurrent: z.number().int().min(0).max(9999),
    hpMax: z.number().int().min(0).max(9999),
    ability: z.string(),
    item: z.string(),
    nature: z.string(),
    teraType: z.string(),
    gender: z.enum(["", "M", "F"]),
    shiny: z.boolean(),
    fainted: z.boolean(),
    moves: z.array(z.string()).max(4),
    evs: Stats.nullable(),
    ivs: Stats.nullable(),
  })
  .partial();

/** Edita campos de un slot. Los nombres (habilidad, objeto, movimientos…) aceptan nombre legible o ID. */
export async function updateSlot(position: number, patch: z.input<typeof SlotPatch>) {
  Position.parse(position);
  const p = SlotPatch.parse(patch);
  return mutate(async ({ runId, log }) => {
    const prev = await loadSlot(runId, position);
    if (!prev.species) throw new Error("El slot está vacío");
    const data: Partial<SlotData> = { ...p };
    if (p.ability !== undefined) data.ability = resolveId("ability", p.ability);
    if (p.item !== undefined) data.item = resolveId("item", p.item);
    if (p.nature !== undefined) data.nature = resolveId("nature", p.nature);
    if (p.teraType !== undefined) data.teraType = resolveType(p.teraType);
    if (p.moves) data.moves = p.moves.map((m) => resolveId("move", m)).filter(Boolean);

    // Subir de nivel recalcula PS máx. si no se envió uno explícito
    if (p.level !== undefined && p.level !== prev.level && p.hpMax === undefined) {
      const s = getSpecies(prev.species)!;
      const hpMax = calcMaxHp(s, p.level);
      data.hpMax = hpMax;
      if (p.hpCurrent === undefined) data.hpCurrent = Math.min(hpMax, prev.hpCurrent + (hpMax - prev.hpMax));
    }
    const hpMax = data.hpMax ?? prev.hpMax;
    if (data.hpCurrent !== undefined) data.hpCurrent = Math.min(Math.max(0, data.hpCurrent), hpMax);
    // PS a 0 => debilitado; curar desde 0 => revive
    if (data.hpCurrent === 0 && p.fainted === undefined) data.fainted = true;
    if (data.hpCurrent && prev.fainted && p.fainted === undefined) data.fainted = false;
    // Marcar debilitado => PS a 0; desmarcarlo (corrección) => PS al máximo
    if (p.fainted === true && !prev.fainted && p.hpCurrent === undefined) data.hpCurrent = 0;
    if (p.fainted === false && prev.fainted && p.hpCurrent === undefined && prev.hpCurrent === 0) data.hpCurrent = hpMax;

    await saveSlot(runId, position, data);

    const name = label({ ...prev, ...data });
    if (data.fainted !== undefined && data.fainted !== prev.fainted)
      await log(data.fainted ? `${name} se debilitó` : `${name} volvió al combate`);
    else if (data.level !== undefined && data.level !== prev.level) await log(`${name} subió a Lv. ${data.level}`);
    else if (data.hpCurrent !== undefined && data.hpCurrent !== prev.hpCurrent)
      await log(`${name}: PS ${prev.hpCurrent} → ${data.hpCurrent}`);
    else await log(`${name} editado`);
  });
}

/** Ajuste rápido de PS: delta positivo cura, negativo resta. */
export async function adjustHp(position: number, delta: number) {
  Position.parse(position);
  z.number().int().parse(delta);
  const run = await getActiveRun();
  const prev = await loadSlot(run.id, position);
  return updateSlot(position, { hpCurrent: Math.max(0, prev.hpCurrent + delta) });
}

export async function clearSlot(position: number) {
  Position.parse(position);
  return mutate(async ({ runId, log }) => {
    const prev = await loadSlot(runId, position);
    await saveSlot(runId, position, EMPTY_SLOT);
    if (prev.species) await log(`${label(prev)} salió del equipo`);
  });
}

/** Reordena: order[i] = posición anterior del slot que queda en la posición i. */
export async function reorderSlots(order: number[]) {
  const parsed = z.array(Position).length(6).parse(order);
  if (new Set(parsed).size !== 6) throw new Error("Orden inválido");
  return mutate(async ({ runId, log }) => {
    const rows = await prisma.slot.findMany({ where: { runId } });
    const byPos = new Map(rows.map((r) => [r.position, r.id]));
    await prisma.$transaction([
      // Posiciones temporales para no chocar con el índice único (runId, position)
      ...rows.map((r) => prisma.slot.update({ where: { id: r.id }, data: { position: r.position + 100 } })),
      ...parsed.map((oldPos, newPos) =>
        prisma.slot.update({ where: { id: byPos.get(oldPos)! }, data: { position: newPos } }),
      ),
    ]);
    await log("Equipo reordenado");
  });
}

export async function healAll() {
  return mutate(async ({ runId, log }) => {
    const rows = await prisma.slot.findMany({ where: { runId, species: { not: "" }, fainted: false } });
    await prisma.$transaction(rows.map((r) => prisma.slot.update({ where: { id: r.id }, data: { hpCurrent: r.hpMax } })));
    await log("Equipo curado (excepto debilitados)");
  });
}

const ConfigPatch = z
  .object({
    opacity: z.number().int().min(0).max(100),
    scale: z.number().int().min(50).max(200),
    gap: z.number().int().min(0).max(64),
    showHp: z.boolean(),
    showNickname: z.boolean(),
    showLevel: z.boolean(),
    showTypes: z.boolean(),
    faintEffect: z.boolean(),
    animated: z.boolean(),
  })
  .partial();

export async function updateConfig(patch: z.input<typeof ConfigPatch>) {
  const data = ConfigPatch.parse(patch);
  return mutate(async ({ runId }) => {
    await prisma.run.update({ where: { id: runId }, data });
  });
}

const RunInfo = z.object({ title: z.string().max(80), game: z.string().max(60), ruleset: z.string().max(120) }).partial();

export async function updateRunInfo(patch: z.input<typeof RunInfo>) {
  const data = RunInfo.parse(patch);
  return mutate(async ({ runId }) => {
    await prisma.run.update({ where: { id: runId }, data });
  });
}

export async function regenerateWidgetToken() {
  return mutate(async ({ runId, log }) => {
    await prisma.run.update({ where: { id: runId }, data: { widgetToken: newToken() } });
    await log("URL del widget regenerada (la anterior dejó de funcionar)");
  });
}

/** Importa un equipo de Showdown reemplazando los 6 slots. */
export async function importShowdown(text: string) {
  z.string().max(20000).parse(text);
  const result = importTeam(text);
  if (!result.slots.length) return { state: null, warnings: result.warnings };
  const state = await mutate(async ({ runId, log }) => {
    await prisma.$transaction(
      Array.from({ length: 6 }, (_, position) =>
        prisma.slot.update({
          where: { runId_position: { runId, position } },
          data: slotToRow(result.slots[position] ?? EMPTY_SLOT),
        }),
      ),
    );
    await log(`Equipo importado desde Showdown (${result.slots.length} Pokémon)`);
  });
  return { state, warnings: result.warnings };
}

/** Texto de Showdown del equipo completo o de un solo slot. */
export async function exportShowdown(position?: number): Promise<string> {
  await requireAdmin();
  if (position !== undefined) Position.parse(position);
  const run = await getActiveRun();
  const rows = await prisma.slot.findMany({ where: { runId: run.id }, orderBy: { position: "asc" } });
  const slots = rows.map(rowToSlot).filter((s) => position === undefined || s.position === position);
  return exportSlots(slots);
}

export async function login(_: unknown, form: FormData) {
  const token = String(form.get("token") ?? "");
  if (!checkToken(token)) return { error: "Contraseña incorrecta" };
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/login");
}

/** Estado actual (el panel lo pide al recibir un aviso por SSE, p. ej. cambios desde otra pestaña). */
export async function fetchRunState(): Promise<RunState> {
  await requireAdmin();
  return getRunState();
}
