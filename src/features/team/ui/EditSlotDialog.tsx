"use client";
// Edición completa de un slot. Los campos de texto aceptan nombres en inglés (formato Showdown);
// el servidor los convierte a ID y descarta los que no existen.
import { ChevronDown, ChevronRight, Save, Sparkles, UserMinus } from "lucide-react";
import { useState } from "react";
import { useDex } from "@/core/pokedex/useDex";
import type { StatID, StatsTable } from "@/core/pokedex/types";
import { Modal } from "@/core/ui/Modal";
import type { updateSlot } from "../actions";
import type { SlotView } from "../types";

type Patch = Parameters<typeof updateSlot>[1];

const STATS: [StatID, string][] = [
  ["hp", "PS"],
  ["atk", "Ata"],
  ["def", "Def"],
  ["spa", "AtE"],
  ["spd", "DfE"],
  ["spe", "Vel"],
];

export interface EditSlotDialogProps {
  slot: SlotView;
  /** Acciones extra que inyecta quien compone (p. ej. "Copiar para Showdown"). */
  extras?: React.ReactNode;
  onClose: () => void;
  onSave: (p: Patch) => void;
  onRemove: () => void;
}

export function EditSlotDialog({ slot, extras, onClose, onSave, onRemove }: EditSlotDialogProps) {
  const dex = useDex();
  const species = dex?.species.find((s) => s.id === slot.species);
  const [advanced, setAdvanced] = useState(!!(slot.evs || slot.ivs));

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (k: string) => String(f.get(k) ?? "").trim();
    const stats = (prefix: string, def: number): StatsTable | null => {
      const t = Object.fromEntries(STATS.map(([k]) => [k, Number(f.get(`${prefix}-${k}`)) || 0])) as StatsTable;
      return Object.values(t).every((v) => v === def) ? null : t;
    };
    onSave({
      nickname: str("nickname"),
      ability: str("ability"),
      item: str("item"),
      nature: str("nature"),
      teraType: str("teraType"),
      gender: str("gender") as Patch["gender"],
      shiny: f.get("shiny") === "on",
      moves: [0, 1, 2, 3].map((i) => str(`move${i}`)).filter(Boolean),
      ...(advanced ? { evs: stats("ev", 0), ivs: stats("iv", 31) } : {}),
    });
  };

  return (
    <Modal title={`Editar ${slot.nickname || slot.speciesName}`} onClose={onClose} wide>
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Mote" className="col-span-2">
            <input name="nickname" defaultValue={slot.nickname} maxLength={24} placeholder={slot.speciesName} className={input} autoFocus />
          </Field>
          <Field label="Género">
            <select name="gender" defaultValue={slot.gender} className={input}>
              <option value="">—</option>
              <option value="M">Macho</option>
              <option value="F">Hembra</option>
            </select>
          </Field>
          <Field label="Naturaleza">
            <input name="nature" list="dl-natures" defaultValue={slot.natureName} className={input} />
          </Field>
          <Field label="Teratipo">
            <select name="teraType" defaultValue={slot.teraType} className={input}>
              <option value="">—</option>
              {dex?.types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Habilidad" className="col-span-2">
            <input name="ability" list="dl-abilities" defaultValue={slot.abilityName} className={input} />
          </Field>
          <Field label="Objeto" className="col-span-2">
            <input name="item" list="dl-items" defaultValue={slot.itemName} placeholder="Ninguno" className={input} />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1 text-xs text-muted">Movimientos</legend>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <input key={i} name={`move${i}`} list="dl-moves" defaultValue={slot.moveNames[i] ?? ""} placeholder={`Movimiento ${i + 1}`} className={input} />
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="shiny" defaultChecked={slot.shiny} className="accent-warn" />
          <Sparkles className="size-4 text-warn" />
          Shiny
        </label>

        <div>
          <button type="button" onClick={() => setAdvanced((a) => !a)} className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
            {advanced ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            EVs / IVs (opcional, para exportar a Showdown)
          </button>
          {advanced && (
            <div className="mt-2 grid gap-2">
              <StatRow label="EVs" prefix="ev" values={slot.evs} def={0} max={252} />
              <StatRow label="IVs" prefix="iv" values={slot.ivs} def={31} max={31} />
            </div>
          )}
        </div>

        <p className="text-xs text-muted">Los nombres van en inglés (como en Showdown). Los que no existan se ignoran.</p>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {extras}
          <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-bad hover:border-bad">
            <UserMinus className="size-4" />
            Quitar del equipo
          </button>
          <button type="button" onClick={onClose} className="ml-auto rounded-lg border border-line px-4 py-2 text-sm">
            Cancelar
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg">
            <Save className="size-4" />
            Guardar
          </button>
        </div>
        {/* Listas para autocompletar */}
        <datalist id="dl-abilities">
          {species?.abilities.map((a) => <option key={`s-${a}`} value={a} />)}
          {dex?.abilities.map((a) => <option key={a.id} value={a.name} />)}
        </datalist>
        <datalist id="dl-items">{dex?.items.map((a) => <option key={a.id} value={a.name} />)}</datalist>
        <datalist id="dl-moves">{dex?.moves.map((a) => <option key={a.id} value={a.name} />)}</datalist>
        <datalist id="dl-natures">{dex?.natures.map((a) => <option key={a.id} value={a.name} />)}</datalist>
      </form>
    </Modal>
  );
}

const input = "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent";

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`grid gap-1 ${className ?? ""}`}>
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

function StatRow(props: { label: string; prefix: string; values: StatsTable | null; def: number; max: number }) {
  return (
    <div className="grid grid-cols-[40px_repeat(6,1fr)] items-center gap-1.5 text-xs">
      <span className="text-muted">{props.label}</span>
      {STATS.map(([k, name]) => (
        <label key={k} className="grid gap-0.5">
          <span className="text-center text-[10px] text-muted">{name}</span>
          <input
            name={`${props.prefix}-${k}`}
            type="number"
            min={0}
            max={props.max}
            defaultValue={props.values?.[k] ?? props.def}
            className="w-full rounded border border-line bg-bg px-1 py-1 text-center outline-none focus:border-accent"
          />
        </label>
      ))}
    </div>
  );
}
