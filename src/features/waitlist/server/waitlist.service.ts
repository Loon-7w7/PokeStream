import "server-only";
import { RateLimiter } from "@/core/rate-limit";
import { fail } from "@/core/result";
import { inviteEmails } from "@/features/auth";
import { canReview, channelUrl, normalizeChannel, shouldSaveSubmission } from "../domain/application";
import type { ApplicationStatus, BetaApplication, Platform } from "../types";
import * as repo from "./waitlist.repository";

/** Casos de uso del preregistro. La API pública (index.ts) decide quién puede llamar a cada uno. */

export interface Submission {
  email: string;
  name: string;
  platform: Platform;
  channel: string;
  message: string;
  /** Campo trampa: invisible para personas; si llega relleno es un bot. */
  website: string;
}

// Formulario público sin login: pocos envíos por IP (sobrevive al hot reload en desarrollo).
const g = globalThis as unknown as { waitlistLimiter?: RateLimiter };
const limiter = (g.waitlistLimiter ??= new RateLimiter(5, 10 * 60_000));

/** La respuesta es siempre la misma (guardado, ignorado o bot): no revela qué correos ya postularon. */
export async function submitApplication(input: Submission, clientKey: string): Promise<void> {
  if (!limiter.take(clientKey)) fail("RATE_LIMITED", "Demasiados envíos seguidos. Espera unos minutos y vuelve a intentarlo.");
  if (input.website) return;

  const channel = normalizeChannel(input.platform, input.channel);
  if (!channel) fail("INVALID", "Escribe tu canal.");
  const existing = await repo.findApplication(input.email);
  if (!shouldSaveSubmission((existing?.status as ApplicationStatus | undefined) ?? null)) return;

  await repo.upsertApplication({
    email: input.email,
    name: input.name || null,
    platform: input.platform,
    channel,
    message: input.message || null,
  });
}

export async function listApplications(): Promise<BetaApplication[]> {
  return (await repo.listApplications()).map((row) => {
    const platform = row.platform as Platform;
    return {
      email: row.email,
      name: row.name,
      platform,
      channel: row.channel,
      channelUrl: channelUrl(platform, row.channel),
      message: row.message,
      status: row.status as ApplicationStatus,
      createdAt: row.createdAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
    };
  });
}

/** Aprobar = invitar el correo (ya puede entrar con Google). Rechazar solo lo marca; se puede aprobar después. */
export async function reviewApplication(email: string, to: "approved" | "rejected"): Promise<void> {
  const row = (await repo.findApplication(email)) ?? fail("NOT_FOUND", "Esa postulación ya no existe.");
  if (!canReview(row.status as ApplicationStatus, to)) fail("CONFLICT", "Esa postulación ya fue revisada. Actualiza la página.");
  if (to === "approved") await inviteEmails([email]); // exige admin
  await repo.setApplicationStatus(email, to);
}
