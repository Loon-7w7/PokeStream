"use client";
// Pestaña Postulantes de /admin: preregistro a la beta. Aprobar = invitar el correo; rechazar se puede deshacer aprobando.
import { Check, ExternalLink, Info, X } from "lucide-react";
import { useState } from "react";
import { useAction } from "@/core/ui/actions";
import { cx } from "@/core/ui/cx";
import type { ApplicationStatus, BetaApplication, Platform } from "@/features/waitlist/types";
import * as A from "../actions";
import { IconButton, LocalDate } from "./parts";

type Filter = ApplicationStatus | "all";

const FILTERS: [Filter, string][] = [
  ["pending", "Pendientes"],
  ["approved", "Aprobados"],
  ["rejected", "Rechazados"],
  ["all", "Todos"],
];

const STATUS: Record<ApplicationStatus, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-warn/15 text-warn" },
  approved: { label: "Aprobado", className: "bg-ok/15 text-ok" },
  rejected: { label: "Rechazado", className: "bg-bad/15 text-bad" },
};

const PLATFORM: Record<Platform, string> = { twitch: "Twitch", kick: "Kick", youtube: "YouTube", other: "Otra" };

export function ApplicationsTable({ applications, registrationOpen }: { applications: BetaApplication[]; registrationOpen: boolean }) {
  const [filter, setFilter] = useState<Filter>("pending");
  const [query, setQuery] = useState("");
  const { run, pending } = useAction();
  const q = query.trim().toLowerCase();
  const shown = applications.filter(
    (a) => (filter === "all" || a.status === filter) && (!q || [a.email, a.name ?? "", a.channel].some((t) => t.toLowerCase().includes(q))),
  );
  const count = (f: Filter) => (f === "all" ? applications.length : applications.filter((a) => a.status === f).length);

  return (
    <section className="rounded-2xl border border-line bg-panel p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="font-semibold">Postulantes</h2>
        <div role="radiogroup" aria-label="Filtrar por estado" className="flex flex-wrap gap-1 text-xs">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              role="radio"
              aria-checked={filter === value}
              onClick={() => setFilter(value)}
              className={cx(
                "rounded-md border px-2 py-1",
                filter === value ? "border-accent bg-accent/15 font-semibold text-accent" : "border-line text-muted hover:text-text",
              )}
            >
              {label} <span className="font-mono">{count(value)}</span>
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar correo, nombre o canal…"
          aria-label="Buscar postulante"
          className="ml-auto w-full max-w-64 rounded-lg border border-line bg-bg px-3 py-1.5 text-sm placeholder:text-muted/60"
        />
      </div>

      <p className="mb-3 flex items-start gap-2 text-xs text-muted">
        <Info className="mt-px size-3.5 shrink-0" />
        {registrationOpen
          ? "El registro está abierto: la página /beta no se muestra y no llegan postulaciones nuevas."
          : "Formulario público en /beta. Aprobar invita el correo (no se envía ningún correo: avísale tú)."}
      </p>

      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          {applications.length ? "No hay postulaciones con este filtro." : "Aún no hay postulaciones. Comparte el enlace /beta."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                <th className="py-2 pr-3 font-medium">Postulante</th>
                <th className="py-2 pr-3 font-medium">Canal</th>
                <th className="py-2 pr-3 font-medium">Mensaje</th>
                <th className="py-2 pr-3 font-medium">Fecha</th>
                <th className="py-2 pr-3 font-medium">Estado</th>
                <th className="py-2 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((a) => (
                <tr key={a.email} className="border-b border-line/60 align-top last:border-0">
                  <td className="py-2 pr-3">
                    <div className="font-semibold">{a.name ?? <span className="font-normal text-muted">Sin nombre</span>}</div>
                    <div className="font-mono text-xs text-muted">{a.email}</div>
                  </td>
                  <td className="py-2 pr-3 text-xs">
                    <div className="text-muted">{PLATFORM[a.platform]}</div>
                    {a.channelUrl ? (
                      <a href={a.channelUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 break-all text-accent hover:underline">
                        {a.channel}
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="break-all">{a.channel}</span>
                    )}
                  </td>
                  <td className="max-w-80 py-2 pr-3 text-xs whitespace-pre-line text-muted">{a.message ?? "—"}</td>
                  <td className="py-2 pr-3 text-xs text-muted">
                    <LocalDate iso={a.createdAt} withTime />
                  </td>
                  <td className="py-2 pr-3">
                    <span className={cx("rounded-md px-2 py-0.5 text-xs font-semibold", STATUS[a.status].className)}>{STATUS[a.status].label}</span>
                  </td>
                  <td className="py-2">
                    <div className="flex justify-end gap-1">
                      {a.status !== "approved" && (
                        <IconButton label="Aprobar (invitar)" Icon={Check} disabled={pending} onClick={() => run(() => A.reviewApplication(a.email, "approved"))} />
                      )}
                      {a.status === "pending" && (
                        <IconButton label="Rechazar" Icon={X} danger disabled={pending} onClick={() => run(() => A.reviewApplication(a.email, "rejected"))} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
