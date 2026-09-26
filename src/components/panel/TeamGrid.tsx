"use client";
// Cuadrícula de 6 slots reordenable con arrastrar y soltar (dnd-kit).
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import type { SlotView } from "@/lib/types";
import { SlotCard } from "./SlotCard";
import type { Run } from "./Panel";

type Props = {
  slots: SlotView[];
  selected: number;
  onSelect: (p: number) => void;
  spritesBase: string;
  onReplace: (p: number) => void;
  onEdit: (p: number) => void;
  /** order[i] = posición anterior del slot que queda en i; optimistic = slots ya reordenados */
  onReorder: (order: number[], optimistic: SlotView[]) => void;
  run: Run;
};

export function TeamGrid({ slots, onReorder, ...rest }: Props) {
  // Distancia mínima para no confundir clics con arrastres
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const ids = slots.map((s) => `slot-${s.position}`);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    const moved = arrayMove(slots, from, to);
    onReorder(
      moved.map((s) => s.position),
      moved.map((s, i) => ({ ...s, position: i })),
    );
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {slots.map((s, i) => (
            <SlotCard key={ids[i]} id={ids[i]} slot={s} {...rest} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
