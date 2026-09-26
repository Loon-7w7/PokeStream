"use client";
// Buscador de reemplazo rápido: escribir -> Enter. Flechas para moverse, Esc para cerrar.
import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { Sprite } from "@/components/Sprite";
import { useDex } from "@/lib/useDex";
import { TYPE_COLORS, TYPE_ES, cx } from "@/lib/ui";
import type { DexSpecies } from "@/lib/types";
import { Modal } from "./Modal";

const MAX_RESULTS = 30;

export function SpeciesPicker(props: {
  position: number;
  current: string | null;
  spritesBase: string;
  onPick: (speciesId: string) => void;
  onClose: () => void;
}) {
  const dex = useDex();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const fuse = useMemo(
    () =>
      dex &&
      new Fuse(dex.species, {
        keys: [
          { name: "name", weight: 3 },
          { name: "id", weight: 2 },
          { name: "num", weight: 1 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [dex],
  );

  const results: DexSpecies[] = useMemo(() => {
    if (!dex || !fuse) return [];
    const term = q.trim();
    if (!term) return dex.species.slice(0, MAX_RESULTS);
    // Número exacto de Pokédex: "445" -> Garchomp y sus formas
    if (/^\d+$/.test(term)) return dex.species.filter((s) => s.num === Number(term)).slice(0, MAX_RESULTS);
    return fuse.search(term, { limit: MAX_RESULTS }).map((r) => r.item);
  }, [q, dex, fuse]);

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      props.onPick(results[active].id);
    }
  };

  return (
    <Modal onClose={props.onClose} title={`${props.current ? `Reemplazar a ${props.current}` : "Agregar Pokémon"} · slot ${props.position + 1}`}>
      <input
        autoFocus
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        placeholder={dex ? "Nombre o número de Pokédex… (Enter para elegir)" : "Cargando Pokédex…"}
        className="w-full rounded-lg border border-line bg-bg px-4 py-3 text-base outline-none focus:border-accent"
      />
      <ul ref={listRef} className="mt-3 max-h-[55vh] overflow-y-auto pr-1">
        {results.map((s, i) => (
          <li key={s.id}>
            <button
              onMouseEnter={() => setActive(i)}
              onClick={() => props.onPick(s.id)}
              className={cx(
                "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left",
                i === active ? "bg-accent/15 ring-1 ring-accent" : "hover:bg-card",
              )}
            >
              <Sprite base={props.spritesBase} spriteId={s.spriteId} alt={s.name} className="h-12 w-12" />
              <span className="w-12 font-mono text-xs text-muted">#{String(s.num).padStart(4, "0")}</span>
              <span className="flex-1 font-medium">{s.name}</span>
              <span className="flex gap-1">
                {s.types.map((t) => (
                  <span
                    key={t}
                    className="rounded px-1.5 py-px text-[10px] font-bold uppercase text-white"
                    style={{ background: TYPE_COLORS[t] }}
                  >
                    {TYPE_ES[t] ?? t}
                  </span>
                ))}
              </span>
            </button>
          </li>
        ))}
        {dex && !results.length && <li className="px-2 py-6 text-center text-sm text-muted">Sin resultados</li>}
      </ul>
    </Modal>
  );
}
