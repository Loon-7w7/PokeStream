// Tipos públicos de la feature waitlist (preregistro a la beta). Puros.

export type Platform = "twitch" | "kick" | "youtube" | "other";

export type ApplicationStatus = "pending" | "approved" | "rejected";

/** Postulación tal como la ve /admin. Fechas en ISO (viajan al cliente). */
export interface BetaApplication {
  email: string;
  name: string | null;
  platform: Platform;
  channel: string;
  /** Enlace al canal (null si no se puede enlazar de forma segura). */
  channelUrl: string | null;
  message: string | null;
  status: ApplicationStatus;
  createdAt: string;
  reviewedAt: string | null;
}
