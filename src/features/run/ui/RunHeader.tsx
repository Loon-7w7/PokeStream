"use client";
import { CircleCheck, LoaderCircle, LogOut, Skull } from "lucide-react";
import { useAction } from "@/core/ui/actions";
import { Logo } from "@/core/ui/Logo";
import { logout } from "@/features/auth/actions";
import { updateRunInfo } from "../actions";
import type { RunInfo } from "../types";

export interface RunHeaderProps {
  info: RunInfo;
  appName: string;
  authEnabled: boolean;
  /** Acciones extra que inyecta quien compone (p. ej. "Nueva partida"). */
  actions?: React.ReactNode;
}

export function RunHeader({ info, appName, authEnabled, actions }: RunHeaderProps) {
  const { run, pending } = useAction();

  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Logo size={34} />
          <span className="text-lg font-bold">{appName}</span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
        <button
          onClick={() => run(() => updateRunInfo({ nuzlocke: !info.nuzlocke }))}
          aria-pressed={info.nuzlocke}
          title="En modo Nuzlocke un Pokémon debilitado no puede revivir"
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
            info.nuzlocke ? "border-bad bg-bad/15 text-bad" : "border-line text-muted hover:border-bad/60 hover:text-text"
          }`}
        >
          <Skull className="size-4" />
          Nuzlocke {info.nuzlocke ? "ON" : "OFF"}
        </button>

        <div className="flex items-center gap-3 text-xs">
          <span className={`inline-flex items-center gap-1 ${pending ? "text-warn" : "text-ok"}`}>
            {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <CircleCheck className="size-3.5" />}
            {pending ? "Guardando…" : "Sincronizado"}
          </span>
          {authEnabled && (
            <form action={logout}>
              <button className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-muted hover:text-text">
                <LogOut className="size-3.5" />
                Salir
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
