"use client";
// Panel: URL para OBS, vista previa en vivo y ajustes visuales del widget.
import { Check, Copy, KeyRound, Move, Rows3, Skull, TriangleAlert, type LucideIcon } from "lucide-react";
import { useEffect, useOptimistic, useRef, useState, useSyncExternalStore } from "react";
import { useAction } from "@/core/ui/actions";
import { ConfirmDialog } from "@/core/ui/ConfirmDialog";
import { regenerateWidgetToken, updateWidgetConfig } from "@/features/run/actions";
import type { WidgetConfig, WidgetConfigPatch, WidgetLayout } from "@/features/run/types";
import { cx } from "@/core/ui/cx";
import type { WidgetSlot } from "../types";
import { PositionEditor } from "./PositionEditor";

type BoolKey = { [K in keyof WidgetConfig]: WidgetConfig[K] extends boolean ? K : never }[keyof WidgetConfig];

const TOGGLES: [BoolKey, string][] = [
  ["showNickname", "Motes"],
  ["showTypes", "Tipos"],
  ["faintEffect", "Gris al debilitarse"],
  ["animated", "Sprites animados"],
];

const LAYOUTS: [WidgetLayout, string, LucideIcon][] = [
  ["hud-bottom", "Fila abajo", Rows3],
  ["free", "Posición libre", Move],
];

const noopSubscribe = () => () => {};

export function WidgetSettings(props: {
  config: WidgetConfig;
  widgetToken: string;
  slots: WidgetSlot[];
  /** Muertes actuales (para la vista del editor). */
  deaths: number;
  nuzlocke: boolean;
  spritesBase: string;
}) {
  const { config: serverConfig, widgetToken, nuzlocke } = props;
  const { run, pending } = useAction();
  const [config, applyOptimistic] = useOptimistic(serverConfig, (c: WidgetConfig, p: WidgetConfigPatch) => ({ ...c, ...p }));
  const origin = useSyncExternalStore(noopSubscribe, () => window.location.origin, () => "");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const url = `${origin}/widget/${widgetToken}`;
  // El contador solo existe en Nuzlocke: fuera de él no se muestra aunque esté activado
  const showCounter = nuzlocke && config.deathCounter;

  const save = (patch: WidgetConfigPatch) => run(() => updateWidgetConfig(patch), () => applyOptimistic(patch));

  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <h2 className="mb-3 font-semibold">Widget para OBS</h2>

      <div data-tour="widget-url" className="flex gap-2">
        <input
          readOnly
          value={url}
          aria-label="URL del widget"
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-2 py-1.5 font-mono text-xs text-muted"
        />
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-2 px-3 text-sm font-semibold text-white"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "¡Copiada!" : "Copiar"}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-muted">
        OBS → Fuente → <b>Navegador</b> → pega la URL · Ancho 1920 · Alto 1080.
      </p>

      <Preview url={origin ? url : ""} />

      <div data-tour="widget-options" className="mt-4 grid gap-2">
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-bg p-1 text-sm" role="radiogroup" aria-label="Distribución">
          {LAYOUTS.map(([value, label, Icon]) => (
            <button
              key={value}
              role="radio"
              aria-checked={config.layout === value}
              onClick={() => config.layout !== value && save({ layout: value })}
              className={cx(
                "inline-flex items-center justify-center gap-1.5 rounded-md py-1.5",
                config.layout === value ? "bg-accent font-semibold text-bg" : "text-muted hover:text-text",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
        {(config.layout === "free" || showCounter) && (
          <button onClick={() => setEditing(true)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-accent/60 py-2 text-sm font-semibold text-accent hover:bg-accent/10">
            <Move className="size-4" />
            {config.layout === "free" ? "Editar posiciones" : "Mover contador de muertes"}
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-3">
        <Slider key={`o${config.opacity}`} label="Opacidad del fondo" value={config.opacity} min={0} max={100} unit="%" onCommit={(v) => save({ opacity: v })} />
        <Slider key={`s${config.scale}`} label="Escala" value={config.scale} min={50} max={150} unit="%" onCommit={(v) => save({ scale: v })} />
        {config.layout === "hud-bottom" && (
          <Slider key={`g${config.gap}`} label="Espacio entre tarjetas" value={config.gap} min={0} max={48} unit="px" onCommit={(v) => save({ gap: v })} />
        )}
        <Slider
          key={`p${config.pokeballOpacity}`}
          label={config.pokeballOpacity ? "Silueta de pokébola" : "Silueta de pokébola (oculta)"}
          value={config.pokeballOpacity}
          min={0}
          max={100}
          unit="%"
          onCommit={(v) => save({ pokeballOpacity: v })}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {TOGGLES.map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={config[key]} onChange={(e) => save({ [key]: e.target.checked })} className="accent-accent" />
            {label}
          </label>
        ))}
      </div>

      <label
        className={cx("mt-3 flex items-center gap-2 text-sm", nuzlocke ? "cursor-pointer" : "cursor-not-allowed text-muted")}
        title={nuzlocke ? "Muestra en el widget cuántos Pokémon han muerto" : "Activa el modo Nuzlocke para usar el contador"}
      >
        <input
          type="checkbox"
          disabled={!nuzlocke}
          checked={showCounter}
          onChange={(e) => save({ deathCounter: e.target.checked })}
          className="accent-accent"
        />
        <Skull className="size-4 text-bad" />
        Contador de muertes
        {!nuzlocke && <span className="text-xs">(solo en modo Nuzlocke)</span>}
      </label>

      <button
        onClick={() => setRegenerating(true)}
        className="mt-4 inline-flex items-center gap-1 text-xs text-muted underline-offset-2 hover:text-bad hover:underline"
      >
        <KeyRound className="size-3.5" />
        Regenerar URL (si se filtró)
      </button>

      {regenerating && (
        <ConfirmDialog
          title="¿Regenerar la URL del widget?"
          icon={KeyRound}
          tone="warn"
          confirmLabel="Sí, regenerar"
          pending={pending}
          onConfirm={async () => {
            const res = await run(regenerateWidgetToken);
            if (res?.ok) setRegenerating(false);
          }}
          onClose={() => setRegenerating(false)}
        >
          <p>Úsalo si alguien más consiguió tu URL. Se crea una nueva y la actual deja de funcionar al instante.</p>
          <p className="flex items-center gap-2 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-warn">
            <TriangleAlert className="size-4 shrink-0" />
            Tendrás que pegar la URL nueva en la fuente de navegador de OBS.
          </p>
        </ConfirmDialog>
      )}

      {editing && (
        <PositionEditor
          config={config}
          slots={props.slots}
          deaths={showCounter ? props.deaths : null}
          spritesBase={props.spritesBase}
          onSave={save}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

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
      {url && (
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

/** Slider que solo guarda al soltar. El padre usa key={valor} para reiniciarlo si cambia desde fuera. */
function Slider(props: { label: string; value: number; min: number; max: number; unit: string; onCommit: (v: number) => void }) {
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
      <input type="range" min={props.min} max={props.max} value={v} onChange={(e) => setV(Number(e.target.value))} onPointerUp={commit} onKeyUp={commit} className="accent-accent" />
    </label>
  );
}
