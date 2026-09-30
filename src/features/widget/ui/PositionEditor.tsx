"use client";
// Editor de posiciones: lienzo 1920x1080 escalado donde se arrastra cada slot (modo libre)
// y el contador de muertes (cualquier layout). Guarda al soltar; OBS se actualiza en vivo por SSE.
import { Check, Grid3x3, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cx } from "@/core/ui/cx";
import { Modal } from "@/core/ui/Modal";
import {
  DEFAULT_DEATH_COUNTER_POSITION,
  DEFAULT_SLOT_POSITIONS,
  WIDGET_CANVAS,
  type SlotPoint,
  type WidgetConfig,
  type WidgetConfigPatch,
} from "@/features/run/types";
import type { WidgetSlot } from "../types";
import { DeathCounter, HudBottom, PlacedSlot, WidgetCard } from "./Widget";

const GRID = 20;
const { width: W, height: H } = WIDGET_CANVAS;

/** Lo que se arrastra: un slot (0-5) o el contador de muertes. */
type Target = number | "deaths";

interface Drag {
  target: Target;
  pointerX: number;
  pointerY: number;
  from: SlotPoint;
}

const targetLabel = (t: Target) => (t === "deaths" ? "Muertes" : `#${t + 1}`);

export function PositionEditor(props: {
  config: WidgetConfig;
  slots: WidgetSlot[];
  /** Muertes a mostrar; null = el contador no está visible. */
  deaths: number | null;
  spritesBase: string;
  onSave: (patch: WidgetConfigPatch) => void;
  onClose: () => void;
}) {
  const { config, deaths } = props;
  const free = config.layout === "free";
  const [positions, setPositions] = useState(config.slotPositions);
  const [counter, setCounter] = useState(config.deathCounterPosition);
  const [snap, setSnap] = useState(true);
  const [active, setActive] = useState<Target | null>(null);
  const drag = useRef<Drag | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pointOf = (t: Target) => (t === "deaths" ? counter : positions[t]);

  const place = (v: number, max: number) => {
    const n = snap ? Math.round(v / GRID) * GRID : Math.round(v);
    return Math.min(max, Math.max(0, n));
  };

  const startDrag = (e: React.PointerEvent, target: Target) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      target,
      pointerX: e.clientX,
      pointerY: e.clientY,
      from: pointOf(target),
    };
    setActive(target);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const to = {
      x: place(d.from.x + (e.clientX - d.pointerX) / scale, W),
      y: place(d.from.y + (e.clientY - d.pointerY) / scale, H),
    };
    if (d.target === "deaths") setCounter(to);
    else setPositions((ps) => ps.map((p, i) => (i === d.target ? to : p)));
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    setActive(null);
    if (!d) return;
    const to = pointOf(d.target);
    if (to.x === d.from.x && to.y === d.from.y) return;
    props.onSave(
      d.target === "deaths"
        ? { deathCounterPosition: to }
        : { slotPositions: positions },
    );
  };

  const reset = () => {
    const patch: WidgetConfigPatch = {};
    if (free) {
      setPositions(DEFAULT_SLOT_POSITIONS);
      patch.slotPositions = DEFAULT_SLOT_POSITIONS;
    }
    if (deaths !== null) {
      setCounter(DEFAULT_DEATH_COUNTER_POSITION);
      patch.deathCounterPosition = DEFAULT_DEATH_COUNTER_POSITION;
    }
    props.onSave(patch);
  };

  const bySlot = new Map(props.slots.map((s) => [s.position, s]));
  const outline = (t: Target) =>
    cx(
      "outline-offset-4 transition-[outline]",
      active === t
        ? "outline-4 outline-solid outline-accent"
        : "hover:outline-2 hover:outline-solid hover:outline-accent/60",
    );

  return (
    <Modal title="Posiciones del widget" onClose={props.onClose} xl>
      <p className="mb-3 text-xs text-muted">
        {free
          ? "Arrastra cada Pokémon a su lugar. Se guarda al soltar y OBS se actualiza en vivo. El lugar es del slot: si lo reemplazas, el nuevo aparece ahí."
          : "Arrastra el contador de muertes a su lugar. Se guarda al soltar y OBS se actualiza en vivo. Los Pokémon siguen en fila abajo."}
      </p>

      <div
        ref={box}
        className="checkerboard relative aspect-video select-none overflow-hidden rounded-lg border border-line"
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: W,
            height: H,
            transform: `scale(${scale})`,
            backgroundImage: snap
              ? "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)"
              : undefined,
            backgroundSize: `${GRID * 3}px ${GRID * 3}px`,
          }}
        >
          {!free && (
            // El transform del lienzo hace que el `fixed` de la fila se ancle a él y no a la ventana
            <div className="pointer-events-none opacity-60">
              <HudBottom
                config={config}
                slots={props.slots}
                spritesBase={props.spritesBase}
              />
            </div>
          )}

          {free &&
            positions.map((point, i) => {
              const slot = bySlot.get(i);
              return (
                <PlacedSlot
                  key={i}
                  point={point}
                  scale={config.scale}
                  onPointerDown={(e) => startDrag(e, i)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  className={cx(
                    "cursor-grab touch-none",
                    active === i && "z-10 cursor-grabbing",
                  )}
                >
                  <div className={cx("rounded-full", outline(i))}>
                    {slot ? (
                      <WidgetCard
                        slot={slot}
                        config={config}
                        spritesBase={props.spritesBase}
                      />
                    ) : (
                      <div className="grid h-[210px] w-[210px] place-items-center rounded-full border-4 border-dashed border-white/25 text-2xl text-white/40">
                        Slot vacío
                      </div>
                    )}
                  </div>
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 font-mono text-xl font-bold text-bg">
                    #{i + 1}
                  </span>
                </PlacedSlot>
              );
            })}

          {deaths !== null && (
            <PlacedSlot
              point={counter}
              scale={config.scale}
              onPointerDown={(e) => startDrag(e, "deaths")}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className={cx(
                "z-20 cursor-grab touch-none",
                active === "deaths" && "cursor-grabbing",
              )}
            >
              <div className={cx("rounded-full", outline("deaths"))}>
                <DeathCounter deaths={deaths} config={config} />
              </div>
            </PlacedSlot>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={snap}
            onChange={(e) => setSnap(e.target.checked)}
            className="accent-accent"
          />
          <Grid3x3 className="size-4 text-muted" />
          Ajustar a cuadrícula ({GRID} px)
        </label>
        {active !== null && (
          <span className="font-mono text-xs text-muted">
            {targetLabel(active)} · x {pointOf(active).x} · y{" "}
            {pointOf(active).y}
          </span>
        )}
        <button
          onClick={() =>
            confirm("¿Volver a las posiciones por defecto?") && reset()
          }
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 hover:border-bad hover:text-bad"
        >
          <RotateCcw className="size-4" />
          Restablecer
        </button>
        <button
          onClick={props.onClose}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 font-semibold text-bg"
        >
          <Check className="size-4" />
          Listo
        </button>
      </div>
    </Modal>
  );
}
