"use server";
import { z } from "zod";
import { runAction } from "@/core/action";
import * as service from "./server/run.service";

/** Server actions de run: validar -> servicio -> ActionResult. Sin lógica aquí. */

const RunInfoInput = z.object({ nuzlocke: z.boolean() }).partial();

export async function updateRunInfo(input: z.input<typeof RunInfoInput>) {
  return runAction(() => service.updateRunInfo(RunInfoInput.parse(input)), { refresh: true });
}

const Point = z.object({ x: z.number().int().min(0).max(1920), y: z.number().int().min(0).max(1080) });

const WidgetConfigInput = z
  .object({
    layout: z.enum(["hud-bottom", "free"]),
    slotPositions: z.array(Point).length(6),
    opacity: z.number().int().min(0).max(100),
    scale: z.number().int().min(50).max(150),
    gap: z.number().int().min(0).max(64),
    pokeballOpacity: z.number().int().min(0).max(100),
    showNickname: z.boolean(),
    showTypes: z.boolean(),
    faintEffect: z.boolean(),
    animated: z.boolean(),
  })
  .partial()
  .strict();

export async function updateWidgetConfig(input: z.input<typeof WidgetConfigInput>) {
  return runAction(() => service.updateWidgetConfig(WidgetConfigInput.parse(input)), { refresh: true });
}

export async function regenerateWidgetToken() {
  return runAction(() => service.regenerateWidgetToken(), { refresh: true });
}
