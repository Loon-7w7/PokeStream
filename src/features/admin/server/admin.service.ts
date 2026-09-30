import "server-only";
import { env } from "@/core/config/env";
import * as auth from "@/features/auth";
import { listRunOwners, notifyOwnerRun } from "@/features/run";
import { countDeathsByRuns, getSpeciesUsage } from "@/features/team";
import { countObsConnections } from "@/features/widget";
import { buildFunnel, modeSummary, weeklySignups } from "../domain/charts";
import { buildAdminUsers } from "../domain/users";
import type { AdminState } from "../types";

/** Casos de uso de /admin. La autorización (solo admins) la aplican las funciones de auth. */

const TOP_SPECIES = 10;

export async function getAdminState(): Promise<AdminState> {
  const access = await auth.getAccessOverview(); // exige admin: va primero
  const owners = await listRunOwners();
  const nuzlockeRuns = owners.filter((o) => o.nuzlocke).map((o) => o.runId);
  const [topSpecies, deaths] = await Promise.all([getSpeciesUsage(TOP_SPECIES), countDeathsByRuns(nuzlockeRuns)]);
  const { users, stats } = buildAdminUsers({ access, owners, obs: countObsConnections() });
  const now = new Date();
  return {
    appName: env.APP_NAME,
    spritesBase: env.SPRITES_BASE_URL,
    registrationOpen: access.registrationOpen,
    users,
    stats,
    charts: {
      funnel: buildFunnel(users, now),
      weekly: weeklySignups(
        owners.map((o) => o.createdAt),
        now,
      ),
      topSpecies,
      modes: modeSummary(owners.map((o) => ({ nuzlocke: o.nuzlocke, deaths: deaths.get(o.runId) ?? 0 }))),
    },
  };
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
