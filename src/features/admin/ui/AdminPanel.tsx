"use client";
// /admin: resumen arriba y dos pestañas: acceso (modo de registro, invitaciones y usuarios) y estadísticas (gráficas).
import {
  ArrowLeft,
  Ban,
  ChartColumn,
  CircleAlert,
  DoorOpen,
  LockKeyhole,
  LogOut,
  MailPlus,
  Radio,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionProvider, useAction } from "@/core/ui/actions";
import { ConfirmDialog } from "@/core/ui/ConfirmDialog";
import { cx } from "@/core/ui/cx";
import { Logo } from "@/core/ui/Logo";
import * as A from "../actions";
import type { AdminState, AdminUser, AdminUserStatus } from "../types";
import { AdminCharts } from "./AdminCharts";

type Tab = "access" | "charts";

const TABS: [Tab, string, React.ComponentType<{ className?: string }>][] = [
  ["access", "Usuarios y acceso", Users],
  ["charts", "Estadísticas", ChartColumn],
];

export function AdminPanel({ state }: { state: AdminState }) {
  const [tab, setTab] = useState<Tab>("access");
  return (
    <ActionProvider>
      <div className="min-h-screen bg-bg text-text">
        <header className="border-b border-line bg-panel">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-4 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Logo size={30} />
              <span className="text-lg font-bold">{state.appName}</span>
              <span className="rounded-md bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">Admin</span>
            </div>
            <Link
              href="/"
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-accent"
            >
              <ArrowLeft className="size-4" />
              Volver al panel
            </Link>
          </div>
        </header>

        <main className="mx-auto grid max-w-[1200px] gap-5 px-4 py-5">
          <ErrorBanner />
          <Stats state={state} />
          <Tabs tab={tab} onChange={setTab} />
          {tab === "access" ? (
            <div role="tabpanel" aria-label="Usuarios y acceso" className="grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <RegistrationMode open={state.registrationOpen} />
                <InviteForm />
              </div>
              <UserTable users={state.users} />
            </div>
          ) : (
            <div role="tabpanel" aria-label="Estadísticas">
              <AdminCharts charts={state.charts} spritesBase={state.spritesBase} />
            </div>
          )}
        </main>
      </div>
    </ActionProvider>
  );
}

function Tabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div role="tablist" aria-label="Secciones" className="grid w-full max-w-md grid-cols-2 gap-1 rounded-lg border border-line bg-panel p-1 text-sm">
      {TABS.map(([value, label, Icon]) => (
        <button
          key={value}
          role="tab"
          aria-selected={tab === value}
          onClick={() => onChange(value)}
          className={cx(
            "inline-flex items-center justify-center gap-1.5 rounded-md py-1.5",
            tab === value ? "bg-accent font-semibold text-bg" : "text-muted hover:text-text",
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

function ErrorBanner() {
  const { error, clearError } = useAction();
  if (!error) return null;
  return (
    <div role="alert" className="flex items-center gap-2 rounded-lg border border-bad/40 bg-bad/10 px-4 py-2 text-sm text-bad">
      <CircleAlert className="size-4 shrink-0" />
      <span className="flex-1">{error}</span>
      <button onClick={clearError} aria-label="Cerrar" className="rounded p-1 hover:bg-bad/15">
        <X className="size-4" />
      </button>
    </div>
  );
}

function Stats({ state }: { state: AdminState }) {
  const router = useRouter();
  const tiles = [
    { label: "Registrados", value: state.stats.registered, Icon: Users, tone: "text-accent" },
    { label: "Invitaciones pendientes", value: state.stats.pendingInvites, Icon: MailPlus, tone: "text-warn" },
    { label: "Widgets en vivo", value: state.stats.widgetsOnline, Icon: Radio, tone: "text-ok" },
    { label: "Bloqueados", value: state.stats.blocked, Icon: Ban, tone: "text-bad" },
  ];
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map(({ label, value, Icon, tone }) => (
        <div key={label} className="rounded-2xl border border-line bg-panel p-4">
          <div className="flex items-center justify-between text-xs text-muted">
            {label}
            <Icon className={cx("size-4", tone)} />
          </div>
          <div className="mt-1 font-mono text-3xl font-bold">{value}</div>
        </div>
      ))}
      <button onClick={() => router.refresh()} className="col-span-full inline-flex items-center gap-1.5 justify-self-end text-xs text-muted hover:text-accent">
        <RefreshCw className="size-3.5" />
        Actualizar datos
      </button>
    </section>
  );
}

function RegistrationMode({ open }: { open: boolean }) {
  const { run, pending } = useAction();
  const [confirming, setConfirming] = useState(false);
  const modes = [
    { value: false, label: "Solo invitados", Icon: LockKeyhole, hint: "Beta cerrada: solo entran los correos invitados." },
    { value: true, label: "Registro abierto", Icon: DoorOpen, hint: "Cualquier cuenta de Google puede crear su equipo." },
  ];
  return (
    <section className="rounded-2xl border border-line bg-panel p-4">
      <h2 className="mb-3 font-semibold">Acceso</h2>
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-bg p-1 text-sm" role="radiogroup" aria-label="Modo de registro">
        {modes.map(({ value, label, Icon }) => (
          <button
            key={label}
            role="radio"
            aria-checked={open === value}
            // Abrir el registro deja entrar a cualquiera: se confirma. Cerrarlo es inmediato.
            onClick={() => open !== value && (value ? setConfirming(true) : run(() => A.setRegistrationOpen(false)))}
            className={cx(
              "inline-flex items-center justify-center gap-1.5 rounded-md py-1.5",
              open === value ? "bg-accent font-semibold text-bg" : "text-muted hover:text-text",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">{modes.find((m) => m.value === open)?.hint} Los administradores siempre pueden entrar.</p>

      {confirming && (
        <ConfirmDialog
          title="¿Abrir el registro?"
          icon={DoorOpen}
          tone="warn"
          confirmLabel="Sí, abrir"
          pending={pending}
          onConfirm={async () => {
            const res = await run(() => A.setRegistrationOpen(true));
            if (res?.ok) setConfirming(false);
          }}
          onClose={() => setConfirming(false)}
        >
          <p>Cualquier persona con una cuenta de Google podrá entrar y crear su equipo, sin invitación.</p>
          <p className="text-muted">Los usuarios bloqueados seguirán sin acceso. Puedes volver a «Solo invitados» cuando quieras.</p>
        </ConfirmDialog>
      )}
    </section>
  );
}

function InviteForm() {
  const { run, pending } = useAction();
  const [text, setText] = useState("");
  const [done, setDone] = useState<number | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await run(() => A.inviteEmails(text));
    if (res?.ok) {
      setText("");
      setDone(res.data);
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-panel p-4">
      <h2 className="mb-3 font-semibold">Invitar</h2>
      <form onSubmit={submit} className="grid gap-2">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setDone(null);
          }}
          rows={2}
          placeholder="correo@gmail.com, otro@gmail.com"
          aria-label="Correos a invitar"
          className="resize-y rounded-lg border border-line bg-bg px-3 py-2 font-mono text-sm placeholder:text-muted/60"
        />
        <div className="flex items-center gap-3">
          <p className="flex-1 text-xs text-muted">
            {done !== null
              ? `✓ ${done} correo${done === 1 ? "" : "s"} invitado${done === 1 ? "" : "s"}.`
              : "Separa varios con comas o saltos de línea. No se envía ningún correo: avísales tú."}
          </p>
          <button
            disabled={pending || !text.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-50"
          >
            <UserPlus className="size-4" />
            Invitar
          </button>
        </div>
      </form>
    </section>
  );
}

const STATUS: Record<AdminUserStatus, { label: string; className: string }> = {
  admin: { label: "Admin", className: "bg-accent/15 text-accent" },
  active: { label: "Activo", className: "bg-ok/15 text-ok" },
  invited: { label: "Invitado", className: "bg-warn/15 text-warn" },
  "no-access": { label: "Sin acceso", className: "bg-line text-muted" },
  blocked: { label: "Bloqueado", className: "bg-bad/15 text-bad" },
};

function UserTable({ users }: { users: AdminUser[] }) {
  const [query, setQuery] = useState("");
  const [blocking, setBlocking] = useState<AdminUser | null>(null);
  const { run, pending } = useAction();
  const shown = users.filter((u) => u.email.includes(query.trim().toLowerCase()));

  return (
    <section className="rounded-2xl border border-line bg-panel p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="font-semibold">Usuarios</h2>
        <span className="rounded-md bg-accent/15 px-2 py-0.5 font-mono text-xs text-accent">{users.length}</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar correo…"
          aria-label="Buscar correo"
          className="ml-auto w-full max-w-60 rounded-lg border border-line bg-bg px-3 py-1.5 text-sm placeholder:text-muted/60"
        />
      </div>

      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          {users.length ? "Ningún correo coincide." : "Aún no hay usuarios. Invita a alguien para empezar."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                <th className="py-2 pr-3 font-medium">Correo</th>
                <th className="py-2 pr-3 font-medium">Estado</th>
                <th className="py-2 pr-3 font-medium">Registro</th>
                <th className="py-2 pr-3 font-medium">Último acceso</th>
                <th className="py-2 pr-3 font-medium">Widget</th>
                <th className="py-2 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.email} className="border-b border-line/60 last:border-0">
                  <td className="py-2 pr-3 font-mono text-xs">{u.email}</td>
                  <td className="py-2 pr-3">
                    <span className={cx("rounded-md px-2 py-0.5 text-xs font-semibold", STATUS[u.status].className)}>{STATUS[u.status].label}</span>
                  </td>
                  <td className="py-2 pr-3 text-xs text-muted">
                    <LocalDate iso={u.registeredAt} />
                  </td>
                  <td className="py-2 pr-3 text-xs text-muted">
                    <LocalDate iso={u.lastLoginAt} withTime />
                  </td>
                  <td className="py-2 pr-3 text-xs">
                    {u.widgetsOnline > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-ok">
                        <span className="size-2 animate-pulse rounded-full bg-ok" />
                        En vivo{u.widgetsOnline > 1 && ` ×${u.widgetsOnline}`}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="py-2">
                    <div className="flex justify-end gap-1">
                      {!u.isAdmin && !u.blocked && (
                        <IconButton
                          label={u.invited ? "Quitar invitación" : "Invitar"}
                          Icon={u.invited ? UserMinus : UserCheck}
                          disabled={pending}
                          onClick={() => (u.invited ? run(() => A.removeInvite(u.email)) : run(() => A.inviteEmails(u.email)))}
                        />
                      )}
                      {u.registeredAt && (
                        <IconButton label="Cerrar sus sesiones" Icon={LogOut} disabled={pending} onClick={() => run(() => A.endSessionsOf(u.email))} />
                      )}
                      {!u.isAdmin &&
                        (u.blocked ? (
                          <IconButton label="Desbloquear" Icon={ShieldCheck} disabled={pending} onClick={() => run(() => A.setBlocked(u.email, false))} />
                        ) : (
                          <IconButton label="Bloquear" Icon={Ban} danger disabled={pending} onClick={() => setBlocking(u)} />
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {blocking && (
        <ConfirmDialog
          title={`¿Bloquear a ${blocking.email}?`}
          icon={Ban}
          confirmLabel="Sí, bloquear"
          pending={pending}
          onConfirm={async () => {
            const res = await run(() => A.setBlocked(blocking.email, true));
            if (res?.ok) setBlocking(null);
          }}
          onClose={() => setBlocking(null)}
        >
          <ul className="grid gap-2">
            <li>Pierde el acceso al panel al instante y se cierran sus sesiones.</li>
            <li>Su widget de OBS se queda en blanco{blocking.widgetsOnline > 0 && " (ahora mismo está en vivo)"}.</li>
            <li>Su equipo no se borra: al desbloquearlo, todo vuelve tal cual.</li>
          </ul>
        </ConfirmDialog>
      )}
    </section>
  );
}

function IconButton(props: { label: string; Icon: React.ComponentType<{ className?: string }>; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  const { Icon } = props;
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.label}
      aria-label={props.label}
      className={cx(
        "rounded-md border border-line p-1.5 text-muted disabled:opacity-50",
        props.danger ? "hover:border-bad hover:text-bad" : "hover:border-accent hover:text-accent",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

/** Fecha en la zona horaria del navegador (el servidor puede estar en otra: se ignora el desajuste). */
function LocalDate({ iso, withTime = false }: { iso: string | null; withTime?: boolean }) {
  if (!iso) return <span>—</span>;
  const text = new Date(iso).toLocaleString("es", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}
