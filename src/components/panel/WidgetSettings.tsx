"use client";
// URL para OBS, vista previa en vivo y ajustes visuales del widget.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import * as A from "@/app/actions";
import type { RunState, WidgetConfig } from "@/lib/types";
import type { Run } from "./Panel";

type BoolKey = { [K in keyof WidgetConfig]: WidgetConfig[K] extends boolean ? K : never }[keyof WidgetConfig];

const TOGGLES: [BoolKey, string][] = [
  ["showHp", "Barra de PS"],
  ["showNickname", "Motes"],
  ["showLevel", "Nivel"],
  ["showTypes", "Tipos"],
  ["faintEffect", "Gris al debilitarse"],
  ["animated", "Sprites animados"],
];

export function WidgetSettings({ state, run }: { state: RunState; spritesBase: string; run: Run }) {
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");
  const [copied, setCopied] = useState(false);
  const url = `${origin}/widget/${state.widgetToken}`;
  const c = state.config;

  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <h2 className="mb-3 font-semibold">Widget para OBS</h2>

      <div className="flex gap-2">
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-2 py-1.5 font-mono text-xs text-muted" />
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="rounded-lg bg-accent-2 px-3 text-sm font-semibold text-white"
        >
          {copied ? "¡Copiada!" : "Copiar"}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-muted">
        OBS → Fuente → <b>Navegador</b> → pega la URL · Ancho 1920 · Alto 1080.
      </p>

      <Preview url={url} />

      <div className="mt-4 grid gap-3">
        <Slider key={`o${c.opacity}`} label="Opacidad del fondo" value={c.opacity} min={0} max={100} unit="%" onCommit={(v) => run(() => A.updateConfig({ opacity: v }))} />
        <Slider key={`s${c.scale}`} label="Escala" value={c.scale} min={50} max={150} unit="%" onCommit={(v) => run(() => A.updateConfig({ scale: v }))} />
        <Slider key={`g${c.gap}`} label="Espacio entre tarjetas" value={c.gap} min={0} max={48} unit="px" onCommit={(v) => run(() => A.updateConfig({ gap: v }))} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {TOGGLES.map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={c[key]} onChange={(e) => run(() => A.updateConfig({ [key]: e.target.checked }))} className="accent-accent" />
            {label}
          </label>
        ))}
      </div>

      <button
        onClick={() => confirm("La URL actual dejará de funcionar y tendrás que pegar la nueva en OBS. ¿Continuar?") && run(A.regenerateWidgetToken)}
        className="mt-4 text-xs text-muted underline-offset-2 hover:text-bad hover:underline"
      >
        Regenerar URL (si se filtró)
      </button>
    </div>
  );
}

const noop = () => () => {};

/** Iframe 1920x1080 escalado al ancho del panel. */
function Preview({ url }: { url: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.18);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / 1920));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="checkerboard relative mt-3 aspect-video overflow-hidden rounded-lg border border-line">
      {url.startsWith("http") && (
        <iframe
          src={url}
          title="Vista previa del widget"
          className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
          style={{ width: 1920, height: 1080, transform: `scale(${scale})`, background: "transparent" }}
        />
      )}
    </div>
  );
}

function Slider(props: { label: string; value: number; min: number; max: number; unit: string; onCommit: (v: number) => void }) {
  // El padre usa key={value}: si el valor cambia desde fuera, el slider se reinicia
  const [v, setV] = useState(props.value);
  const commit = () => v !== props.value && props.onCommit(v);
  return (
    <label className="grid gap-1 text-sm">
      <span className="flex justify-between">
        <span>{props.label}</span>
        <span className="font-mono text-xs text-accent">
          {v}
          {props.unit}
        </span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        className="accent-accent"
      />
    </label>
  );
}
