import "server-only";
import { env } from "@/core/config/env";
import * as auth from "@/features/auth";
import { listRunOwners, notifyOwnerRun } from "@/features/run";
import { countObsConnections } from "@/features/widget";
import { buildAdminUsers } from "../domain/users";
import type { AdminState } from "../types";

/** Casos de uso de /admin. La autorización (solo admins) la aplican las funciones de auth. */

export async function getAdminState(): Promise<AdminState> {
  const access = await auth.getAccessOverview(); // exige admin: va primero
  const { users, stats } = buildAdminUsers({ access, owners: await listRunOwners(), obs: countObsConnections() });
  return { appName: env.APP_NAME, registrationOpen: access.registrationOpen, users, stats };
}

export const setRegistrationOpen = (open: boolean) => auth.setRegistrationOpen(open);

/** Devuelve cuántos correos se invitaron. */
export async function inviteEmails(text: string) {
  const emails = auth.parseEmailList(text);
  await auth.inviteEmails(emails);
  return emails.length;
}

export const removeInvite = (email: string) => auth.removeInvite(email);

/** Bloquear corta al momento su panel y su widget de OBS; desbloquear lo devuelve. */
export async function setBlocked(email: string, blocked: boolean) {
  await auth.setBlocked(email, blocked);
  await notifyOwnerRun(email);
}

export const endSessionsOf = (email: string) => auth.endSessionsOf(email);
