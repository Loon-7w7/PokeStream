"use client";
// Sección del equipo: cuadrícula reordenable, atajos de teclado, diálogos y UI optimista.
import { useEffect, useId, useOptimistic, useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { useAction } from "@/core/ui/actions";
import { Kbd } from "@/core/ui/Kbd";
import * as A from "../actions";
import type { SlotPatch, SlotView } from "../types";
import { EditSlotDialog } from "./EditSlotDialog";
import { SlotCard } from "./SlotCard";
import { SpeciesPicker } from "./SpeciesPicker";

type Optimistic = { type: "reorder"; slots: SlotView[] } | { type: "patch"; position: number; patch: SlotPatch };
type Dialog = { kind: "replace" | "edit"; position: number } | null;

export interface TeamSectionProps {
  slots: SlotView[];
  spritesBase: string;
  /** Modo Nuzlocke de la run: un debilitado no puede revivir. */
  nuzlocke: boolean;
  /** Acciones extra en el diálogo Editar de cada Pokémon (las inyecta el dashboard). */
  renderEditExtras?: (slot: SlotView) => React.ReactNode;
}

export function TeamSection({ slots: serverSlots, spritesBase, nuzlocke, renderEditExtras }: TeamSectionProps) {
  const { run } = useAction();
  const [slots, applyOptimistic] = useOptimistic(serverSlots, (current: SlotView[], action: Optimistic) =>
    action.type === "reorder"
      ? action.slots
      : current.map((s) => (s.position === action.position ? { ...s, ...action.patch } : s)),
  );
  const [selected, setSelected] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(null);
  // id estable entre servidor y cliente: sin él, dnd-kit genera aria-describedby distintos (error de hidratación)
  const dndId = useId();

  const patch = (position: number, p: SlotPatch) =>
    run(() => A.updateSlot(position, p), () => applyOptimistic({ type: "patch", position, patch: p }));

  // Atajos: 1-6 elegir, R reemplazar, E editar, F debilitar/revivir
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (dialog || e.ctrlKey || e.metaKey || e.altKey || t.closest("input,textarea,select,[contenteditable]")) return;
      const k = e.key.toLowerCase();
      const slot = slots[selected];
      if (k >= "1" && k <= "6") setSelected(Number(k) - 1);
      else if (k === "r") {
        e.preventDefault();
        setDialog({ kind: "replace", position: selected });
      } else if (k === "e" && slot?.species) setDialog({ kind: "edit", position: selected });
      else if (k === "f" && slot?.species && !(nuzlocke && slot.fainted)) patch(selected, { fainted: !slot.fainted });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // dnd-kit: distancia mínima para no confundir clics con arrastres
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const ids = slots.map((s) => `slot-${s.position}`);
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const moved = arrayMove(slots, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    run(
      () => A.reorderTeam(moved.map((s) => s.position)),
      () => applyOptimistic({ type: "reorder", slots: moved.map((s, i) => ({ ...s, position: i })) }),
    );
  };

  const dialogSlot = dialog ? slots[dialog.position] : null;
  const count = slots.filter((s) => s.species).length;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Equipo activo</h2>
        <span className="rounded-md bg-accent/15 px-2 py-0.5 font-mono text-xs text-accent">{count} / 6</span>
        <span className="text-xs text-muted">
          <Kbd>1</Kbd>–<Kbd>6</Kbd> elegir · <Kbd>R</Kbd> reemplazar · <Kbd>E</Kbd> editar · <Kbd>F</Kbd> debilitar
        </span>
      </div>

      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {slots.map((s, i) => (
              <SlotCard
                key={ids[i]}
                id={ids[i]}
                slot={s}
                selected={selected === s.position}
                nuzlocke={nuzlocke}
                spritesBase={spritesBase}
                onSelect={() => setSelected(s.position)}
                onReplace={() => setDialog({ kind: "replace", position: s.position })}
                onEdit={() => setDialog({ kind: "edit", position: s.position })}
                onPatch={(p) => patch(s.position, p)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {dialog?.kind === "replace" && (
        <SpeciesPicker
          title={`${dialogSlot?.speciesName ? `Reemplazar a ${dialogSlot.speciesName}` : "Agregar Pokémon"} · slot ${dialog.position + 1}`}
          spritesBase={spritesBase}
          onClose={() => setDialog(null)}
          onPick={(speciesId) => {
            const position = dialog.position;
            setDialog(null);
            setSelected(position);
            run(() => A.replaceSpecies(position, speciesId));
          }}
        />
      )}
      {dialog?.kind === "edit" && dialogSlot?.species && (
        <EditSlotDialog
          slot={dialogSlot}
          extras={renderEditExtras?.(dialogSlot)}
          onClose={() => setDialog(null)}
          onRemove={() => {
            const destination = nuzlocke && dialogSlot.fainted ? "Muertos" : "la caja";
            if (!confirm(`¿Quitar a ${dialogSlot.nickname || dialogSlot.speciesName} del equipo? Irá a ${destination}.`)) return;
            const position = dialog.position;
            setDialog(null);
            run(() => A.clearSlot(position));
          }}
          onSave={(p) => {
            const position = dialog.position;
            setDialog(null);
            run(() => A.updateSlot(position, p));
          }}
        />
      )}
    </section>
  );
}
