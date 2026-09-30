"use server";
import { z } from "zod";
import { runAction } from "@/core/action";
import * as service from "./server/admin.service";

/** Server actions de /admin: validar -> servicio -> ActionResult. Sin lógica aquí. */

const Email = z.email().trim().toLowerCase();

export async function setRegistrationOpen(open: boolean) {
  return runAction(() => service.setRegistrationOpen(z.boolean().parse(open)), { refresh: true });
}

export async function inviteEmails(text: string) {
  return runAction(() => service.inviteEmails(z.string().max(10_000).parse(text)), { refresh: true });
}

export async function removeInvite(email: string) {
  return runAction(() => service.removeInvite(Email.parse(email)), { refresh: true });
}

export async function setBlocked(email: string, blocked: boolean) {
  return runAction(() => service.setBlocked(Email.parse(email), z.boolean().parse(blocked)), { refresh: true });
}

export async function endSessionsOf(email: string) {
  return runAction(() => service.endSessionsOf(Email.parse(email)), { refresh: true });
}
