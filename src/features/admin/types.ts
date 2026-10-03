// Tipos públicos de la feature admin (gestión de la beta cerrada). Puros.
import type { BetaApplication } from "@/features/waitlist/types";

/**
 * admin: ADMIN_EMAILS · active: registrado y con acceso · invited: invitado que aún no ha entrado
 * · no-access: registrado pero ya sin acceso (le quitaron la invitación) · blocked: sin panel ni widget.
 */
export type AdminUserStatus = "admin" | "active" | "invited" | "no-access" | "blocked";

export interface AdminUser {
  email: string;
  status: AdminUserStatus;
  invited: boolean;
  blocked: boolean;
  isAdmin: boolean;
  /** Fechas en ISO; null = nunca. */
  registeredAt: string | null;
  lastLoginAt: string | null;
  /** Widgets de OBS conectados ahora. */
  widgetsOnline: number;
}

export interface AdminStats {
  registered: number;
  pendingInvites: number;
  widgetsOnline: number;
  blocked: number;
}

/** Datos de las gráficas de /admin (ya agregados en el servidor). */
export interface AdminCharts {
  /** Embudo de la beta, de más amplio a más estrecho. */
  funnel: { label: string; value: number }[];
  /** Registros por semana (lunes UTC en ISO), las últimas 12, de la más antigua a la actual. */
  weekly: { week: string; count: number }[];
  /** Especies más usadas en los equipos actuales. */
  topSpecies: { speciesId: string; name: string; spriteId: string; count: number }[];
  modes: { nuzlocke: number; normal: number; avgDeaths: number | null; maxDeaths: number };
}

export interface AdminState {
  appName: string;
  spritesBase: string;
  registrationOpen: boolean;
  users: AdminUser[];
  /** Preregistro a la beta, de la más reciente a la más antigua. */
  applications: BetaApplication[];
  stats: AdminStats;
  charts: AdminCharts;
}
