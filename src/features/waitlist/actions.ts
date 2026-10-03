"use server";
import { z } from "zod";
import { runAction } from "@/core/action";
import { fail } from "@/core/result";
import { PLATFORMS } from "./domain/application";
import { isWaitlistOpen } from ".";
import { getClientKey } from "./server/client-key";
import * as service from "./server/waitlist.service";

/** Server action pública del preregistro: validar -> servicio -> ActionResult. Sin lógica aquí. */

const Submission = z.object({
  email: z.email("Escribe un correo válido.").trim().toLowerCase().max(254),
  name: z.string().trim().max(60),
  platform: z.enum(PLATFORMS),
  channel: z.string().trim().min(1, "Escribe tu canal.").max(200),
  message: z.string().trim().max(500),
  website: z.string().max(200),
});

export async function submitApplication(input: z.input<typeof Submission>) {
  return runAction(async () => {
    if (!(await isWaitlistOpen())) fail("CONFLICT", "El registro ya está abierto para todos: entra directamente con Google.");
    await service.submitApplication(Submission.parse(input), await getClientKey());
  });
}
