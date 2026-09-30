// Tipos públicos de la feature admin (gestión de la beta cerrada). Puros.

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

export interface AdminState {
  appName: string;
  registrationOpen: boolean;
  users: AdminUser[];
  stats: AdminStats;
}
