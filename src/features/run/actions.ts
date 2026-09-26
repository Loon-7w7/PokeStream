"use server";
import { z } from "zod";
import { runAction } from "@/core/action";
import * as service from "./server/run.service";

/** Server actions de run: validar -> servicio -> ActionResult. Sin lógica aquí. */

const RunInfoInput = z.object({ title: z.string().trim().max(80), game: z.string().trim().max(60), ruleset: z.string().trim().max(120) }).partial();

export async function updateRunInfo(input: z.input<typeof RunInfoInput>) {
  return runAction(() => service.updateRunInfo(RunInfoInput.parse(input)), { refresh: true });
}

const WidgetConfigInput = z
  .object({
    opacity: z.number().int().min(0).max(100),
    scale: z.number().int().min(50).max(150),
    gap: z.number().int().min(0).max(64),
    showHp: z.boolean(),
    showNickname: z.boolean(),
    showLevel: z.boolean(),
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
