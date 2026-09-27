"use client";
// Pestañas Caja / Muertos. A la caja llegan los que salen del equipo, los importados y los que se agregan a mano.
import { useState } from "react";
import { useAction } from "@/core/ui/actions";
import { cx } from "@/core/ui/cx";
import { Sprite } from "@/core/ui/Sprite";
import * as A from "../actions";
import type { SlotView, StorageView, StoredView } from "../types";
import { SpeciesPicker } from "./SpeciesPicker";

type Tab = "box" | "graveyard";

export interface StoragePanelProps {
  storage: StorageView;
  team: SlotView[];
  nuzlocke: boolean;
  spritesBase: string;
}

export function StoragePanel({ storage, team, nuzlocke, spritesBase }: StoragePanelProps) {
  const { run } = useAction();
  const [tab, setTab] = useState<Tab>("box");
  const [selected, setSelected] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);
  const list = storage[tab];
  const current = list.find((p) => p.index === selected) ?? null;
  // Lo más reciente primero
  const shown = [...list].reverse();

  const switchTab = (t: Tab) => {
    setTab(t);
    setSelected(null);
  };
  const release = (p: StoredView) => {
    const msg = tab === "box" ? `¿Soltar a ${label(p)}? Desaparece de la caja.` : `¿Borrar a ${label(p)} de Muertos?`;
    if (!confirm(msg)) return;
    setSelected(null);
    run(() => A.releaseStored(tab, p.index));
  };
  const withdraw = (p: StoredView, position: number) => {
    setSelected(null);
    run(() => A.withdrawFromBox(p.index, position));
  };

  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="grid w-full max-w-sm grid-cols-2 gap-1 rounded-lg border border-line bg-bg p-1 text-sm" role="tablist">
          <TabButton active={tab === "box"} onClick={() => switchTab("box")}>
            Caja <Count n={storage.box.length} />
          </TabButton>
          <TabButton active={tab === "graveyard"} onClick={() => switchTab("graveyard")}>
            💀 Muertos <Count n={storage.graveyard.length} />
          </TabButton>
        </div>
        {tab === "box" && (
          <button onClick={() => setPicking(true)} className="ml-auto rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-bg hover:brightness-110">
            + Agregar a la caja
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          {tab === "box" ? "Aquí llegan los Pokémon que salen del equipo, los importados de Showdown y los que agregues." : "Aquí irán los Pokémon muertos en modo Nuzlocke al sacarlos del equipo."}
        </p>
      ) : (
        <ul className="grid max-h-80 grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-6 lg:grid-cols-8 2xl:grid-cols-10" role="tabpanel">
          {shown.map((p) => (
            <li key={p.index}>
              <button
                onClick={() => setSelected(selected === p.index ? null : p.index)}
                title={p.nickname ? `${p.nickname} (${p.speciesName})` : p.speciesName}
                className={cx(
                  "flex w-full flex-col items-center rounded-lg border p-1 text-[11px]",
                  selected === p.index ? "border-accent bg-accent/10" : "border-transparent hover:border-line hover:bg-card",
                )}
              >
                <Sprite base={spritesBase} spriteId={p.spriteId} shiny={p.shiny} alt={p.speciesName} className={cx("h-14 w-14", tab === "graveyard" && "opacity-70 grayscale")} />
                <span className="w-full truncate text-center">{label(p)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {current && (
        <div className="mt-3 rounded-lg border border-line bg-bg p-3 text-sm">
          <div className="mb-2 font-semibold">{label(current)}</div>
          {tab === "box" && (
            <>
              <div className="mb-1 text-xs text-muted">Llevar al equipo, en el slot:</div>
              <div className="grid max-w-sm grid-cols-6 gap-1">
                {team.map((s) => (
                  <button
                    key={s.position}
                    onClick={() => withdraw(current, s.position)}
                    title={slotTitle(s, nuzlocke)}
                    className="rounded-md border border-line py-1 font-mono hover:border-accent hover:text-accent"
                  >
                    {s.position + 1}
                  </button>
                ))}
              </div>
            </>
          )}
          <button onClick={() => release(current)} className="mt-3 text-xs text-muted underline-offset-2 hover:text-bad hover:underline">
            {tab === "box" ? "Soltar (borrar de la caja)" : "Borrar de Muertos"}
          </button>
        </div>
      )}

      {picking && (
        <SpeciesPicker
          title="Agregar a la caja"
          spritesBase={spritesBase}
          onClose={() => setPicking(false)}
          onPick={(speciesId) => {
            setPicking(false);
            run(() => A.addSpeciesToBox(speciesId));
          }}
        />
      )}
    </div>
  );
}

const label = (p: StoredView) => p.nickname || p.speciesName;

function slotTitle(s: SlotView, nuzlocke: boolean) {
  if (!s.species) return `Slot ${s.position + 1}: vacío`;
  const name = s.nickname || s.speciesName;
  return `Slot ${s.position + 1}: ${name} irá a ${nuzlocke && s.fainted ? "Muertos" : "la caja"}`;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button role="tab" aria-selected={active} onClick={onClick} className={cx("rounded-md py-1.5", active ? "bg-accent font-semibold text-bg" : "text-muted hover:text-text")}>
      {children}
    </button>
  );
}

const Count = ({ n }: { n: number }) => <span className="font-mono text-xs opacity-70">({n})</span>;
