"use client";
// Editor de posiciones del modo libre: lienzo 1920x1080 escalado donde se arrastra cada slot.
// Guarda al soltar; el widget de OBS se actualiza en vivo por SSE.
import { Check, Grid3x3, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cx } from "@/core/ui/cx";
import { Modal } from "@/core/ui/Modal";
import { DEFAULT_SLOT_POSITIONS, WIDGET_CANVAS, type SlotPoint, type WidgetConfig } from "@/features/run/types";
import type { WidgetSlot } from "../types";
import { PlacedSlot, WidgetCard } from "./Widget";

const GRID = 20;
const { width: W, height: H } = WIDGET_CANVAS;

interface Drag {
  index: number;
  pointerX: number;
  pointerY: number;
  from: SlotPoint;
}

export function PositionEditor(props: {
  config: WidgetConfig;
  slots: WidgetSlot[];
  spritesBase: string;
  onSave: (positions: SlotPoint[]) => void;
  onClose: () => void;
}) {
  const { config } = props;
  const [positions, setPositions] = useState(config.slotPositions);
  const [snap, setSnap] = useState(true);
  const [active, setActive] = useState<number | null>(null);
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

  const place = (v: number, max: number) => {
    const n = snap ? Math.round(v / GRID) * GRID : Math.round(v);
    return Math.min(max, Math.max(0, n));
  };

  const onPointerDown = (index: number) => (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { index, pointerX: e.clientX, pointerY: e.clientY, from: positions[index] };
    setActive(index);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const x = place(d.from.x + (e.clientX - d.pointerX) / scale, W);
    const y = place(d.from.y + (e.clientY - d.pointerY) / scale, H);
    setPositions((ps) => ps.map((p, i) => (i === d.index ? { x, y } : p)));
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    setActive(null);
    if (!d) return;
    const to = positions[d.index];
    if (to.x !== d.from.x || to.y !== d.from.y) props.onSave(positions);
  };

  const reset = () => {
    setPositions(DEFAULT_SLOT_POSITIONS);
    props.onSave(DEFAULT_SLOT_POSITIONS);
  };

  const bySlot = new Map(props.slots.map((s) => [s.position, s]));

  return (
    <Modal title="Posiciones del widget" onClose={props.onClose} xl>
      <p className="mb-3 text-xs text-muted">
        Arrastra cada Pokémon a su lugar. Se guarda al soltar y OBS se actualiza en vivo. El lugar es del slot: si lo reemplazas, el nuevo aparece ahí.
      </p>

      <div ref={box} className="checkerboard relative aspect-video select-none overflow-hidden rounded-lg border border-line">
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
          {positions.map((point, i) => {
            const slot = bySlot.get(i);
            return (
              <PlacedSlot
                key={i}
                point={point}
                scale={config.scale}
                onPointerDown={onPointerDown(i)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className={cx("cursor-grab touch-none", active === i && "z-10 cursor-grabbing")}
              >
                <div className={cx("rounded-full outline-offset-4 transition-[outline]", active === i ? "outline-4 outline-solid outline-accent" : "hover:outline-2 hover:outline-solid hover:outline-accent/60")}>
                  {slot ? (
                    <WidgetCard slot={slot} config={config} spritesBase={props.spritesBase} />
                  ) : (
                    <div className="grid h-[210px] w-[210px] place-items-center rounded-full border-4 border-dashed border-white/25 text-2xl text-white/40">
                      Slot vacío
                    </div>
                  )}
                </div>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 font-mono text-xl font-bold text-bg">#{i + 1}</span>
              </PlacedSlot>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} className="accent-accent" />
          <Grid3x3 className="size-4 text-muted" />
          Ajustar a cuadrícula ({GRID} px)
        </label>
        {active !== null && (
          <span className="font-mono text-xs text-muted">
            #{active + 1} · x {positions[active].x} · y {positions[active].y}
          </span>
        )}
        <button onClick={() => confirm("¿Volver a colocar los 6 slots en fila abajo?") && reset()} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 hover:border-bad hover:text-bad">
          <RotateCcw className="size-4" />
          Restablecer
        </button>
        <button onClick={props.onClose} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 font-semibold text-bg">
          <Check className="size-4" />
          Listo
        </button>
      </div>
    </Modal>
  );
}
