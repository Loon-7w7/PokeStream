// Agregados para las gráficas de /admin. DOMINIO PURO.
import type { AdminCharts, AdminUser } from "../types";

const DAY = 86_400_000;
export const ACTIVE_DAYS = 30;
export const WEEKS = 12;

/** Embudo: con acceso → registrados → activos (30 días) → con widget en vivo ahora. Sin bloqueados. */
export function buildFunnel(users: AdminUser[], now: Date): AdminCharts["funnel"] {
  const ok = users.filter((u) => !u.blocked);
  const registered = ok.filter((u) => u.registeredAt);
  const since = now.getTime() - ACTIVE_DAYS * DAY;
  return [
    { label: "Invitados y registrados", value: ok.length },
    { label: "Registrados", value: registered.length },
    { label: `Activos (${ACTIVE_DAYS} días)`, value: registered.filter((u) => u.lastLoginAt && Date.parse(u.lastLoginAt) >= since).length },
    { label: "En vivo ahora", value: registered.filter((u) => u.widgetsOnline > 0).length },
  ];
}

/** Lunes 00:00 UTC de la semana de `date`. */
export function weekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

/** Registros por semana: las últimas `WEEKS` (incluida la actual), también las que tienen 0. */
export function weeklySignups(dates: string[], now: Date): AdminCharts["weekly"] {
  const current = weekStart(now).getTime();
  const weeks = Array.from({ length: WEEKS }, (_, i) => ({ week: new Date(current - (WEEKS - 1 - i) * 7 * DAY).toISOString(), count: 0 }));
  const index = new Map(weeks.map((w, i) => [w.week, i]));
  for (const iso of dates) {
    const i = index.get(weekStart(new Date(iso)).toISOString());
    if (i !== undefined) weeks[i].count++;
  }
  return weeks;
}

/** Runs en Nuzlocke frente a normales, y muertes de las Nuzlocke. */
export function modeSummary(runs: { nuzlocke: boolean; deaths: number }[]): AdminCharts["modes"] {
  const deaths = runs.filter((r) => r.nuzlocke).map((r) => r.deaths);
  return {
    nuzlocke: deaths.length,
    normal: runs.length - deaths.length,
    avgDeaths: deaths.length ? Math.round((deaths.reduce((a, b) => a + b, 0) / deaths.length) * 10) / 10 : null,
    maxDeaths: Math.max(0, ...deaths),
  };
}
