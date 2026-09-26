"use client";
// Tarjeta de un slot en el panel: reemplazo rápido, PS, evolución, debilitado.
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as A from "@/app/actions";
import { Sprite } from "@/components/Sprite";
import { TYPE_COLORS, TYPE_ES, cx, hpColor, hpPercent } from "@/lib/ui";
import type { SlotView } from "@/lib/types";
import type { Run } from "./Panel";

type Props = {
  id: string;
  slot: SlotView;
  selected: number;
  onSelect: (p: number) => void;
  spritesBase: string;
  onReplace: (p: number) => void;
  onEdit: (p: number) => void;
  run: Run;
};

export function SlotCard({ id, slot, selected, onSelect, spritesBase, onReplace, onEdit, run }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const p = slot.position;
  const isSel = selected === p;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={() => onSelect(p)}
      className={cx(
        "group relative flex flex-col rounded-2xl border bg-card p-4 transition-colors",
        isSel ? "border-accent shadow-[0_0_0_1px_var(--color-accent)]" : "border-line hover:border-muted/50",
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
        <span className="font-mono">#{p + 1}</span>
        {slot.species && (
          <label className="ml-auto flex cursor-pointer items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={slot.fainted}
              onChange={(e) => run(() => A.updateSlot(p, { fainted: e.target.checked }))}
              className="accent-bad"
            />
            Debilitado
          </label>
        )}
      </div>

      {slot.species ? <Filled slot={slot} spritesBase={spritesBase} run={run} /> : <Empty />}

      <div className="mt-auto flex flex-wrap gap-2 pt-3" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onReplace(p)}
          className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg hover:brightness-110"
        >
          {slot.species ? "Reemplazar" : "Agregar Pokémon"}
        </button>
        {slot.species && (
          <>
            <button onClick={() => onEdit(p)} className="rounded-lg border border-line px-3 py-2 text-sm hover:border-accent">
              Editar
            </button>
            <CardMenu slot={slot} run={run} />
          </>
        )}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="grid min-h-[190px] place-items-center rounded-xl border border-dashed border-line text-sm text-muted">
      Slot vacío
    </div>
  );
}

function Filled({ slot, spritesBase, run }: { slot: SlotView; spritesBase: string; run: Run }) {
  const p = slot.position;
  return (
    <>
      <div className="flex gap-3">
        <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-bg/60">
          <Sprite
            base={spritesBase}
            spriteId={slot.spriteId}
            shiny={slot.shiny}
            animated={false}
            alt={slot.speciesName}
            className={cx("h-20 w-20", slot.fainted && "grayscale")}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <div className="truncate text-lg font-bold">{slot.nickname || slot.speciesName}</div>
            <div className="shrink-0 font-mono text-xs text-accent">Nv.{slot.level}</div>
          </div>
          {slot.nickname && <div className="truncate text-xs text-muted">{slot.speciesName}</div>}
          <div className="mt-1 flex flex-wrap gap-1">
            {slot.types.map((t) => (
              <span
                key={t}
                className="rounded px-1.5 py-px text-[10px] font-bold uppercase text-white"
                style={{ background: TYPE_COLORS[t] }}
              >
                {TYPE_ES[t] ?? t}
              </span>
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

      <HpControl slot={slot} run={run} />

      {slot.moveNames.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-1 text-xs">
          {slot.moveNames.map((m, i) => (
            <li key={i} className="truncate rounded-md bg-bg/60 px-2 py-1">
              {m}
            </li>
          ))}
        </ul>
      )}

      {slot.evos.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs" onClick={(e) => e.stopPropagation()}>
          <span className="text-muted">Evolucionar:</span>
          {slot.evos.map((e) => (
            <button
              key={e.id}
              onClick={() => run(() => A.evolveSlot(p, e.id))}
              className="rounded-md border border-line px-2 py-0.5 hover:border-ok hover:text-ok"
            >
              {e.name}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function HpControl({ slot, run }: { slot: SlotView; run: Run }) {
  const p = slot.position;
  const [step, setStep] = useState(10);
  const pct = hpPercent(slot.hpCurrent, slot.hpMax);
  return (
    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
      <div className="mb-1 flex items-center justify-between font-mono text-xs">
        <span className="text-muted">PS</span>
        <span className="flex items-center gap-1">
          <input
            key={slot.hpCurrent}
            type="number"
            defaultValue={slot.hpCurrent}
            min={0}
            max={slot.hpMax}
            aria-label="PS actuales"
            onBlur={(e) => {
              const v = Number(e.currentTarget.value);
              if (Number.isFinite(v) && v !== slot.hpCurrent) run(() => A.updateSlot(p, { hpCurrent: Math.round(v) }));
            }}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="w-14 rounded border border-transparent bg-transparent text-right outline-none hover:border-line focus:border-accent"
          />
          / {slot.hpMax} <span className="text-muted">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: hpColor(slot.hpCurrent, slot.hpMax) }}
        />
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs">
        <button
          onClick={() => run(() => A.adjustHp(p, -step))}
          className="rounded-md border border-line px-2 py-0.5 hover:border-bad hover:text-bad"
        >
          −{step}
        </button>
        <button
          onClick={() => run(() => A.adjustHp(p, step))}
          className="rounded-md border border-line px-2 py-0.5 hover:border-ok hover:text-ok"
        >
          +{step}
        </button>
        <select
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
          aria-label="Cantidad"
          className="rounded-md border border-line bg-card px-1 py-0.5"
        >
          {[1, 5, 10, 25, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button
          onClick={() => run(() => A.updateSlot(p, { hpCurrent: slot.hpMax, fainted: false }))}
          className="ml-auto rounded-md border border-line px-2 py-0.5 hover:border-ok hover:text-ok"
        >
          Curar
        </button>
      </div>
    </div>
  );
}

function CardMenu({ slot, run }: { slot: SlotView; run: Run }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const p = slot.position;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-line px-3 py-2 text-sm hover:border-accent"
        aria-label="Más opciones"
      >
        ⋯
      </button>
      {open && (
        <div
          className="absolute bottom-full right-0 z-20 mb-1 w-48 overflow-hidden rounded-lg border border-line bg-panel text-sm shadow-xl"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            className="block w-full px-3 py-2 text-left hover:bg-card"
            onClick={async () => {
              await navigator.clipboard.writeText(await A.exportShowdown(p));
              setCopied(true);
              setTimeout(() => {
                setCopied(false);
                setOpen(false);
              }, 900);
            }}
          >
            {copied ? "¡Copiado!" : "Copiar para Showdown"}
          </button>
          <button
            className="block w-full px-3 py-2 text-left hover:bg-card"
            onClick={() => {
              setOpen(false);
              run(() => A.updateSlot(p, { shiny: !slot.shiny }));
            }}
          >
            {slot.shiny ? "Quitar shiny" : "Marcar shiny"}
          </button>
          <button
            className="block w-full px-3 py-2 text-left text-bad hover:bg-card"
            onClick={() => {
              setOpen(false);
              if (confirm(`¿Quitar a ${slot.nickname || slot.speciesName} del equipo?`)) run(() => A.clearSlot(p));
            }}
          >
            Quitar del equipo
          </button>
        </div>
      )}
    </div>
  );
}
