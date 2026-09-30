"use client";
// Reinicia todo para empezar una partida nueva, con un modal de confirmación (no se puede deshacer).
import { Check, LoaderCircle, RotateCcw, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { useAction } from "@/core/ui/actions";
import { Modal } from "@/core/ui/Modal";
import * as A from "../actions";

export function NewGameButton() {
  const { run, pending } = useAction();
  const [open, setOpen] = useState(false);

  const start = async () => {
    const res = await run(A.startNewGame);
    if (res?.ok) setOpen(false);
  };

  return (
    <>
      <button data-tour="new-game" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:border-warn hover:text-warn">
        <RotateCcw className="size-4" />
        Nueva partida
      </button>

      {open && (
        <Modal title="¿Empezar una nueva partida?" onClose={() => setOpen(false)}>
          <ul className="grid gap-2 text-sm">
            <li className="flex gap-2">
              <X className="mt-0.5 size-4 shrink-0 text-bad" />
              <span>
                Se vacían <b>el equipo</b>, <b>la caja</b> y <b>Muertos</b>.
              </span>
            </li>
            <li className="flex gap-2">
              <X className="mt-0.5 size-4 shrink-0 text-bad" />
              <span>
                El modo <b>Nuzlocke</b> se apaga.
              </span>
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-ok" />
              <span>Se conservan la configuración del widget y la URL de OBS.</span>
            </li>
          </ul>

          <p className="mt-4 flex items-center gap-2 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
            <TriangleAlert className="size-4 shrink-0" />
            No se puede deshacer.
          </p>

          <div className="mt-5 flex justify-end gap-2 text-sm">
            <button onClick={() => setOpen(false)} autoFocus className="rounded-lg border border-line px-4 py-2">
              Cancelar
            </button>
            <button onClick={start} disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg bg-bad px-4 py-2 font-semibold text-white hover:brightness-110 disabled:opacity-50">
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              {pending ? "Reiniciando…" : "Sí, empezar de cero"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
