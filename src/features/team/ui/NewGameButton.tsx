"use client";
// Reinicia todo para empezar una partida nueva (con confirmación: no se puede deshacer).
import { useAction } from "@/core/ui/actions";
import * as A from "../actions";

export function NewGameButton() {
  const { run } = useAction();
  const start = () => {
    const ok = confirm(
      "¿Empezar una nueva partida?\n\nSe vacían el equipo, la caja y Muertos, se borran título, juego y reglas, y Nuzlocke se apaga.\nLa configuración del widget y la URL de OBS se conservan.\n\nNo se puede deshacer.",
    );
    if (ok) run(A.startNewGame);
  };
  return (
    <button onClick={start} className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:border-warn hover:text-warn">
      ↺ Nueva partida
    </button>
  );
}
