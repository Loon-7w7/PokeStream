// Vista de usuarios de /admin: junta acceso (auth), runs (run) y conexiones (widget). DOMINIO PURO.
import type { AdminStats, AdminUser, AdminUserStatus } from "../types";

// Formas mínimas de lo que llega de auth (AccessOverview) y run (RunOwner): el dominio no importa otras features.
interface Sources {
  access: {
    registrationOpen: boolean;
    admins: string[];
    entries: { email: string; invited: boolean; blocked: boolean; lastLoginAt: string | null }[];
  };
  owners: { runId: string; email: string; createdAt: string }[];
  /** Widgets de OBS conectados por runId. */
  obs: Map<string, number>;
}

function statusOf(u: { isAdmin: boolean; blocked: boolean; invited: boolean; registered: boolean }, registrationOpen: boolean): AdminUserStatus {
  if (u.isAdmin) return "admin";
  if (u.blocked) return "blocked";
  if (!u.registered) return "invited";
  return registrationOpen || u.invited ? "active" : "no-access";
}

const ORDER: AdminUserStatus[] = ["admin", "active", "invited", "no-access", "blocked"];

export function buildAdminUsers({ access, owners, obs }: Sources): { users: AdminUser[]; stats: AdminStats } {
  const entries = new Map(access.entries.map((e) => [e.email, e]));
  const runs = new Map(owners.map((o) => [o.email, o]));
  const emails = new Set([...access.admins, ...entries.keys(), ...runs.keys()]);

  const users = [...emails].map((email): AdminUser => {
    const entry = entries.get(email);
    const run = runs.get(email);
    const flags = { isAdmin: access.admins.includes(email), blocked: entry?.blocked ?? false, invited: entry?.invited ?? false };
    return {
      email,
      ...flags,
      status: statusOf({ ...flags, registered: Boolean(run) }, access.registrationOpen),
      registeredAt: run?.createdAt ?? null,
      lastLoginAt: entry?.lastLoginAt ?? null,
      widgetsOnline: run ? (obs.get(run.runId) ?? 0) : 0,
    };
  });

  // Por estado y, dentro, los más recientes primero
  users.sort(
    (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || (b.lastLoginAt ?? "").localeCompare(a.lastLoginAt ?? "") || a.email.localeCompare(b.email),
  );

  return {
    users,
    stats: {
      registered: owners.length,
      pendingInvites: users.filter((u) => u.status === "invited").length,
      widgetsOnline: users.reduce((n, u) => n + u.widgetsOnline, 0),
      blocked: users.filter((u) => u.blocked).length,
    },
  };
}
