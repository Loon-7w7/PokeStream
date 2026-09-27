"use client";
// Tarjeta de un slot: reemplazo rápido, evolución y debilitado. El resto de opciones está en Editar.
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAction } from "@/core/ui/actions";
import { cx } from "@/core/ui/cx";
import { Sprite } from "@/core/ui/Sprite";
import { TypeBadge } from "@/core/ui/TypeBadge";
import * as A from "../actions";
import type { SlotPatch, SlotView } from "../types";

export interface SlotCardProps {
  id: string;
  slot: SlotView;
  selected: boolean;
  /** Modo Nuzlocke: un debilitado queda muerto y no se puede revivir. */
  nuzlocke: boolean;
  spritesBase: string;
  onSelect: () => void;
  onReplace: () => void;
  onEdit: () => void;
  /** Cambio con respuesta instantánea (useOptimistic) + guardado en servidor. */
  onPatch: (patch: SlotPatch) => void;
}

export function SlotCard(props: SlotCardProps) {
  const { slot, selected } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={props.onSelect}
      className={cx(
        "group relative flex flex-col rounded-2xl border bg-card p-4 transition-colors",
        selected ? "border-accent shadow-[0_0_0_1px_var(--color-accent)]" : "border-line hover:border-muted/50",
        isDragging && "z-10 opacity-80",
        slot.fainted && "bg-card/60",
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-xs text-muted">
        <button
          {...attributes}
          {...listeners}
          title="Arrastra para reordenar"
          className="cursor-grab touch-none rounded px-1 font-mono hover:bg-line active:cursor-grabbing"
        >
          ⠿
        </button>
        <span className="font-mono">#{slot.position + 1}</span>
        {slot.species && <FaintButton fainted={slot.fainted} nuzlocke={props.nuzlocke} onPatch={props.onPatch} />}
      </div>

      {slot.species ? (
        <Filled slot={slot} spritesBase={props.spritesBase} />
      ) : (
        <div className="grid min-h-[190px] place-items-center rounded-xl border border-dashed border-line text-sm text-muted">
          Slot vacío
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-3" onClick={(e) => e.stopPropagation()}>
        <button onClick={props.onReplace} className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg hover:brightness-110">
          {slot.species ? "Reemplazar" : "Agregar Pokémon"}
        </button>
        {slot.species && (
          <>
            <button onClick={props.onEdit} className="rounded-lg border border-line px-3 py-2 text-sm hover:border-accent">
              Editar
            </button>
            {slot.evos.length > 0 && <EvolveButton slot={slot} />}
          </>
        )}
      </div>
    </div>
  );
}

function Filled({ slot, spritesBase }: { slot: SlotView; spritesBase: string }) {
  return (
    <>
      <div className="flex gap-3">
        <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-bg/60">
          <Sprite
            base={spritesBase}
            spriteId={slot.spriteId}
            shiny={slot.shiny}
            alt={slot.speciesName}
            className={cx("h-20 w-20", slot.fainted && "grayscale")}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-bold">{slot.nickname || slot.speciesName}</div>
          {slot.nickname && <div className="truncate text-xs text-muted">{slot.speciesName}</div>}
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {slot.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
            {slot.shiny && <span className="text-xs text-warn">★ shiny</span>}
          </div>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 text-xs">
            <dt className="text-muted">Habilidad</dt>
            <dd className="truncate">{slot.abilityName || "—"}</dd>
            <dt className="text-muted">Objeto</dt>
            <dd className="truncate">{slot.itemName || "—"}</dd>
          </dl>
        </div>
      </div>

      {slot.moveNames.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-1 text-xs">
          {slot.moveNames.map((m, i) => (
            <li key={i} className="truncate rounded-md bg-bg/60 px-2 py-1">
              {m}
            </li>
          ))}
        </ul>
      )}

    </>
  );
}

/** Evolucionar: directo si hay una sola evolución; si hay varias (ej. Eevee), menú para elegir. */
function EvolveButton({ slot }: { slot: SlotView }) {
  const { run } = useAction();
  const [open, setOpen] = useState(false);
  const evolve = (id: string) => run(() => A.evolveSlot(slot.position, id));
  const [only] = slot.evos;
  const btn = "rounded-lg border border-ok/50 px-3 py-2 text-sm text-ok hover:bg-ok/10";

  if (slot.evos.length === 1) {
    return (
      <button onClick={() => evolve(only.id)} title={`Evolucionar a ${only.name}`} className={btn}>
        Evolucionar
      </button>
    );
  }
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className={btn} aria-expanded={open}>
        Evolucionar ▾
      </button>
      {open && (
        <div
          className="absolute bottom-full left-0 z-20 mb-1 max-h-64 w-44 overflow-y-auto rounded-lg border border-line bg-panel text-sm shadow-xl"
          onMouseLeave={() => setOpen(false)}
        >
          {slot.evos.map((e) => (
            <button
              key={e.id}
              onClick={() => {
                setOpen(false);
                evolve(e.id);
              }}
              className="block w-full px-3 py-2 text-left hover:bg-card hover:text-ok"
            >
              {e.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Debilitar / revivir. En Nuzlocke, un debilitado queda muerto (sin botón para revivir). */
function FaintButton({ fainted, nuzlocke, onPatch }: { fainted: boolean; nuzlocke: boolean; onPatch: (p: SlotPatch) => void }) {
  const base = "ml-auto rounded-md border px-2 py-0.5 font-semibold";
  if (fainted && nuzlocke) {
    return (
      <span title="Modo Nuzlocke: no puede revivir" className={cx(base, "border-bad/60 bg-bad/15 text-bad")}>
        💀 Muerto
      </span>
    );
  }
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onPatch({ fainted: !fainted });
      }}
      title={fainted ? "Volver al combate" : nuzlocke ? "Nuzlocke: no se podrá revivir" : "Marcar como debilitado"}
      className={cx(base, fainted ? "border-bad/60 bg-bad/15 text-bad hover:border-ok hover:bg-transparent hover:text-ok" : "border-line hover:border-bad hover:text-bad")}
    >
      {fainted ? "Debilitado · Revivir" : "Debilitar"}
    </button>
  );
}
