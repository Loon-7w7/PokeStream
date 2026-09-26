"use client";
// Panel de control: estado de la run, atajos de teclado y orquestación de diálogos.
import { useCallback, useEffect, useState, useTransition } from "react";
import * as A from "@/app/actions";
import type { RunState } from "@/lib/types";
import { TeamGrid } from "./TeamGrid";
import { SpeciesPicker } from "./SpeciesPicker";
import { EditSlotDialog } from "./EditSlotDialog";
import { WidgetSettings } from "./WidgetSettings";
import { ShowdownBox } from "./ShowdownBox";
import { HistoryList } from "./HistoryList";
import { RunHeader } from "./RunHeader";

export type RunActions = typeof A;
/** Ejecuta una server action que devuelve RunState y actualiza el panel. */
export type Run = (fn: () => Promise<RunState | null | void>) => void;

type Dialog = { kind: "replace" | "edit"; position: number } | null;

export function Panel(props: { initial: RunState; spritesBase: string; appName: string; authEnabled: boolean }) {
  const [state, setState] = useState(props.initial);
  const [selected, setSelected] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run: Run = useCallback((fn) => {
    setError(null);
    startTransition(async () => {
      try {
        const next = await fn();
        if (next) setState(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error inesperado");
      }
    });
  }, []);

  // Sincroniza con cambios hechos desde otra pestaña/dispositivo
  useEffect(() => {
    const es = new EventSource(`/api/stream/${state.widgetToken}`);
    es.addEventListener("state", () => A.fetchRunState().then(setState).catch(() => {}));
    return () => es.close();
  }, [state.widgetToken]);

  // Atajos: 1-6 seleccionar, R reemplazar, E editar, F debilitar/revivir
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (dialog || e.ctrlKey || e.metaKey || e.altKey || t.closest("input,textarea,select,[contenteditable]")) return;
      const k = e.key.toLowerCase();
      if (k >= "1" && k <= "6") setSelected(Number(k) - 1);
      else if (k === "r") {
        e.preventDefault();
        setDialog({ kind: "replace", position: selected });
      } else if (k === "e" && state.slots[selected]?.species) setDialog({ kind: "edit", position: selected });
      else if (k === "f" && state.slots[selected]?.species)
        run(() => A.updateSlot(selected, { fainted: !state.slots[selected].fainted }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, selected, state.slots, run]);

  const slot = dialog ? state.slots[dialog.position] : null;
  const teamCount = state.slots.filter((s) => s.species).length;

  return (
    <div className="min-h-screen bg-bg text-text">
      <RunHeader state={state} appName={props.appName} authEnabled={props.authEnabled} run={run} pending={pending} />

      {error && (
        <div className="mx-auto mt-4 max-w-[1500px] px-4">
          <div className="rounded-lg border border-bad/40 bg-bad/10 px-4 py-2 text-sm text-bad">{error}</div>
        </div>
      )}

      <main className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 lg:grid-cols-[1fr_380px]">
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">Equipo activo</h2>
            <span className="rounded-md bg-accent/15 px-2 py-0.5 font-mono text-xs text-accent">{teamCount} / 6</span>
            <span className="text-xs text-muted">
              Atajos: <Kbd>1</Kbd>–<Kbd>6</Kbd> elegir · <Kbd>R</Kbd> reemplazar · <Kbd>E</Kbd> editar · <Kbd>F</Kbd>{" "}
              debilitar
            </span>
            <button
              onClick={() => run(A.healAll)}
              className="ml-auto rounded-lg border border-line px-3 py-1.5 text-sm hover:border-ok hover:text-ok"
            >
              Curar a todos
            </button>
          </div>
          <TeamGrid
            slots={state.slots}
            selected={selected}
            onSelect={setSelected}
            spritesBase={props.spritesBase}
            onReplace={(position) => setDialog({ kind: "replace", position })}
            onEdit={(position) => setDialog({ kind: "edit", position })}
            onReorder={(order, optimistic) => {
              setState((s) => ({ ...s, slots: optimistic }));
              run(() => A.reorderSlots(order));
            }}
            run={run}
          />
        </section>

        <aside className="flex flex-col gap-5">
          <WidgetSettings state={state} spritesBase={props.spritesBase} run={run} />
          <ShowdownBox run={run} onError={setError} />
          <HistoryList history={state.history} />
        </aside>
      </main>

      {dialog?.kind === "replace" && (
        <SpeciesPicker
          position={dialog.position}
          current={slot?.speciesName || null}
          spritesBase={props.spritesBase}
          onClose={() => setDialog(null)}
          onPick={(speciesId) => {
            const position = dialog.position;
            setDialog(null);
            setSelected(position);
            run(() => A.replaceSpecies(position, speciesId));
          }}
        />
      )}
      {dialog?.kind === "edit" && slot?.species && (
        <EditSlotDialog
          slot={slot}
          onClose={() => setDialog(null)}
          onSave={(patch) => {
            const position = dialog.position;
            setDialog(null);
            run(() => A.updateSlot(position, patch));
          }}
        />
      )}
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-card px-1.5 py-px font-mono text-[10px] text-text">{children}</kbd>
  );
}
