"use server";
import { z } from "zod";
import { runAction } from "@/core/action";
import { requireAdmin } from "@/features/auth";
import * as showdown from "./server/showdown.service";

export async function exportShowdown(position?: number) {
  return runAction(async () => {
    await requireAdmin();
    return showdown.exportTeam(z.number().int().min(0).max(5).optional().parse(position));
  });
}

export async function importShowdown(text: string) {
  return runAction(() => showdown.importTeam(z.string().max(20_000).parse(text)), { refresh: true });
}
