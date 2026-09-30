"use client";
// Menú de perfil de la cabecera: cuenta, admin, tour y salir. Se cierra al hacer clic fuera o con Esc.
import { CircleHelp, LogOut, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/core/ui/ConfirmDialog";
import { logout } from "@/features/auth/actions";

const ITEM = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-card";

export function ProfileMenu(props: {
  /** null sin login (uso local): no hay cuenta ni "Salir". */
  email: string | null;
  isAdmin: boolean;
  onStartTour: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={root} className="relative">
      <button
        data-tour="profile"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de perfil"
        title="Perfil"
        className="grid size-9 place-items-center rounded-full border border-line bg-card text-muted transition-colors hover:border-accent hover:text-accent aria-expanded:border-accent aria-expanded:text-accent"
      >
        <UserRound className="size-5" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-line bg-panel p-1.5 text-text shadow-2xl">
          {props.email && (
            <div className="border-b border-line px-3 pb-2.5 pt-1.5">
              <div className="text-xs text-muted">Sesión iniciada como</div>
              <div className="truncate text-sm font-semibold" title={props.email}>
                {props.email}
              </div>
            </div>
          )}
          <div className="grid gap-0.5 py-1">
            {props.isAdmin && (
              <Link role="menuitem" href="/admin" onClick={() => setOpen(false)} className={ITEM}>
                <ShieldCheck className="size-4 text-accent" />
                Administración
              </Link>
            )}
            <button role="menuitem" onClick={choose(props.onStartTour)} className={ITEM}>
              <CircleHelp className="size-4 text-muted" />
              Ver el tour del panel
            </button>
          </div>
          {props.email && (
            <div className="border-t border-line pt-1">
              <button role="menuitem" onClick={choose(() => setConfirmLogout(true))} className={`${ITEM} text-muted hover:text-bad`}>
                <LogOut className="size-4" />
                Salir
              </button>
            </div>
          )}
        </div>
      )}

      {confirmLogout && (
        <ConfirmDialog title="¿Cerrar sesión?" icon={LogOut} tone="accent" confirmLabel="Salir" formAction={logout} onClose={() => setConfirmLogout(false)}>
          <p>Tu equipo queda guardado y el widget sigue funcionando en OBS. Para volver al panel tendrás que iniciar sesión con Google.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
