"use client";
import { CircleCheck, Lock, LoaderCircle, Skull } from "lucide-react";
import { useState } from "react";
import { useAction } from "@/core/ui/actions";
import { ConfirmDialog } from "@/core/ui/ConfirmDialog";
import { Logo } from "@/core/ui/Logo";
import { updateRunInfo } from "../actions";
import type { RunInfo } from "../types";

export interface RunHeaderProps {
  info: RunInfo;
  appName: string;
  /** Acciones extra que inyecta quien compone (p. ej. "Nueva partida"). */
  actions?: React.ReactNode;
  /** Menú de perfil al final de la cabecera (lo compone el dashboard). */
  profile?: React.ReactNode;
}

export function RunHeader({ info, appName, actions, profile }: RunHeaderProps) {
  const { run, pending } = useAction();
  const [dialog, setDialog] = useState<"nuzlocke" | null>(null);

  const activateNuzlocke = async () => {
    const res = await run(() => updateRunInfo({ nuzlocke: true }));
    if (res?.ok) setDialog(null);
  };

  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Logo size={34} />
          <span className="text-lg font-bold">{appName}</span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
        {/* Una vez activo no se puede apagar: solo "Nueva partida" lo desactiva */}
        <button
          data-tour="nuzlocke"
          onClick={() => setDialog("nuzlocke")}
          disabled={info.nuzlocke}
          aria-pressed={info.nuzlocke}
          title={info.nuzlocke ? "El modo Nuzlocke está activo hasta que empieces una nueva partida" : "Activar el modo Nuzlocke"}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
            info.nuzlocke ? "cursor-default border-bad bg-bad/15 text-bad" : "border-line text-muted hover:border-bad/60 hover:text-text"
          }`}
        >
          <Skull className="size-4" />
          Nuzlocke {info.nuzlocke ? "ON" : "OFF"}
          {info.nuzlocke && <Lock className="size-3.5" />}
        </button>

        <div className="flex items-center gap-3 text-xs">
          <span className={`inline-flex items-center gap-1 ${pending ? "text-warn" : "text-ok"}`}>
            {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <CircleCheck className="size-3.5" />}
            {pending ? "Guardando…" : "Sincronizado"}
          </span>
          {profile}
        </div>
      </div>

      {dialog === "nuzlocke" && (
        <ConfirmDialog
          title="¿Activar el modo Nuzlocke?"
          icon={Skull}
          confirmLabel="Sí, activar"
          pending={pending}
          onConfirm={activateNuzlocke}
          onClose={() => setDialog(null)}
        >
          <ul className="grid gap-2">
            <li>
              Un Pokémon debilitado queda <b>muerto</b>: no se puede revivir.
            </li>
            <li>
              Al sacarlo del equipo va a <b>Muertos</b>, no a la caja.
            </li>
            <li>Podrás mostrar un contador de muertes en el widget.</li>
          </ul>
          <p className="flex items-center gap-2 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-warn">
            <Lock className="size-4 shrink-0" />
            No se puede desactivar: solo una nueva partida lo apaga.
          </p>
        </ConfirmDialog>
      )}
    </header>
  );
}
