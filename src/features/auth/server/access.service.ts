import "server-only";
import { fail } from "@/core/result";
import type { AccessOverview } from "../types";
import * as access from "./access.repository";
import * as sessions from "./session.repository";

/** Casos de uso de administración del acceso. La API pública (index.ts) los expone solo a admins. */

export async function getAccessOverview(admins: string[]): Promise<AccessOverview> {
  const [registrationOpen, entries] = await Promise.all([access.getRegistrationOpen(), access.listAccess()]);
  return {
    registrationOpen,
    admins,
    entries: entries.map((e) => ({ email: e.email, invited: e.invited, blocked: e.blocked, lastLoginAt: e.lastLoginAt?.toISOString() ?? null })),
  };
}

export const setRegistrationOpen = (open: boolean) => access.setRegistrationOpen(open).then(() => {});

export async function inviteEmails(emails: string[]) {
  if (!emails.length) fail("INVALID", "Escribe al menos un correo.");
  for (const email of emails) await access.upsertAccess(email, { invited: true });
}

export async function removeInvite(email: string) {
  await access.upsertAccess(email, { invited: false });
  await access.pruneAccess(email);
}

/** Bloquear también cierra sus sesiones (el acceso ya se niega en cada petición; esto limpia). */
export async function setBlocked(email: string, blocked: boolean, isAdmin: boolean) {
  if (blocked && isAdmin) fail("INVALID", "No puedes bloquear a un administrador. Quítalo antes de ADMIN_EMAILS.");
  await access.upsertAccess(email, { blocked });
  if (blocked) await sessions.deleteSessionsOf(email);
  else await access.pruneAccess(email);
}

export const endSessionsOf = (email: string) => sessions.deleteSessionsOf(email).then(() => {});
