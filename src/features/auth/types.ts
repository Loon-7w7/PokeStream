/** Motivo por el que falló el login; viaja en `/login?error=…`. */
export type LoginError = "invalid_state" | "not_allowed" | "google_failed";

/** Estado del control de acceso para /admin. Fechas en ISO (viajan al cliente). */
export interface AccessOverview {
  registrationOpen: boolean;
  admins: string[];
  entries: { email: string; invited: boolean; blocked: boolean; lastLoginAt: string | null }[];
}
