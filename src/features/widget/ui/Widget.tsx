"use client";
// Widget de OBS: fondo transparente, 1920x1080. Solo pinta lo que llega por SSE (sin lógica de negocio).
import { Skull } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { cx } from "@/core/ui/cx";
import { Sprite } from "@/core/ui/Sprite";
import { TypeBadge } from "@/core/ui/TypeBadge";
import type { SlotPoint, WidgetConfig } from "@/features/run/types";
import type { WidgetSlot, WidgetState } from "../types";

/** Espera antes de reconectar si el servidor rechazó el stream. */
const RETRY_MS = 30_000;

export function Widget({ token, initial, spritesBase }: { token: string; initial: WidgetState; spritesBase: string }) {
  const [state, setState] = useState<WidgetState | null>(initial);

  useEffect(() => {
    let es: EventSource;
    let retry: ReturnType<typeof setTimeout>;
    let stopped = false;
    const connect = () => {
      es = new EventSource(`/api/stream/${encodeURIComponent(token)}`);
      es.addEventListener("state", (e) => setState(JSON.parse((e as MessageEvent).data)));
      // Bloqueado: en blanco; al desbloquear, el reintento de abajo lo recupera
      es.addEventListener("blocked", () => setState(null));
      es.addEventListener("revoked", () => {
        setState(null);
        stopped = true;
        es.close();
      });
      // Si el servidor rechaza la conexión (bloqueado o caído), EventSource se rinde: reintentar
      es.onerror = () => {
        if (!stopped && es.readyState === EventSource.CLOSED) retry = setTimeout(connect, RETRY_MS);
      };
    };
    connect();
    return () => {
      stopped = true;
      clearTimeout(retry);
      es.close();
    };
  }, [token]);

  if (!state) return null;
  return (
    <>
      {state.config.layout === "free" ? <FreeLayout state={state} spritesBase={spritesBase} /> : <HudBottom config={state.config} slots={state.slots} spritesBase={spritesBase} />}
      {state.deaths !== null && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <PlacedSlot point={state.config.deathCounterPosition} scale={state.config.scale}>
            <DeathCounter deaths={state.deaths} config={state.config} />
          </PlacedSlot>
        </div>
      )}
    </>
  );
}

/** Layout "HUD inferior": fila de tarjetas centrada abajo. */
export function HudBottom({ config, slots, spritesBase }: { config: WidgetConfig; slots: WidgetSlot[]; spritesBase: string }) {
  return (
    <div className="fixed inset-0 flex items-end justify-center overflow-hidden pb-6">
      <div className="flex items-end" style={{ gap: config.gap, transform: `scale(${config.scale / 100})`, transformOrigin: "bottom center" }}>
        {slots.map((s) => (
          // key con especie: al reemplazar se re-monta y anima la entrada
          <WidgetCard key={`${s.position}-${s.speciesName}`} slot={s} config={config} spritesBase={spritesBase} />
        ))}
      </div>
    </div>
  );
}

/** Layout "libre": cada slot centrado en su posición guardada (lienzo 1920x1080). */
function FreeLayout({ state, spritesBase }: { state: WidgetState; spritesBase: string }) {
  const { config, slots } = state;
  return (
    <div className="fixed inset-0 overflow-hidden">
      {slots.map((s) => (
        <PlacedSlot key={`${s.position}-${s.speciesName}`} point={config.slotPositions[s.position]} scale={config.scale}>
          <WidgetCard slot={s} config={config} spritesBase={spritesBase} />
        </PlacedSlot>
      ))}
    </div>
  );
}

/** Coloca un slot con su centro en `point`, escalado alrededor del centro. */
export function PlacedSlot({ point, scale, children, ...rest }: { point: SlotPoint; scale: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cx("absolute", rest.className)} style={{ left: point.x, top: point.y, transform: `translate(-50%, -50%) scale(${scale / 100})` }}>
      {children}
    </div>
  );
}

/** La silueta de pokébola sigue a la opacidad del fondo: 75 % de fondo = 15 % de silueta. */
const POKEBALL_RATIO = 0.2;

/** Fondo y borde de las tarjetas del widget según la opacidad elegida. */
const surface = (opacity: number): React.CSSProperties => ({
  background: `rgba(16, 27, 46, ${opacity / 100})`,
  borderColor: `rgba(53, 184, 243, ${0.15 + (opacity / 100) * 0.35})`,
  boxShadow: opacity > 0 ? "0 8px 30px rgba(0,0,0,0.35)" : "none",
});

/** Contador de muertes (Nuzlocke). Se coloca como un slot más con su propia posición. */
export function DeathCounter({ deaths, config }: { deaths: number; config: WidgetConfig }) {
  return (
    <div className="anim-slot-in flex items-center gap-3 whitespace-nowrap rounded-full border px-6 py-3 text-text" style={surface(config.opacity)}>
      <Skull className="size-8 text-bad drop-shadow" aria-hidden />
      <span className="text-2xl font-bold drop-shadow">
        Muertes: <span className="font-mono">{deaths}</span>
      </span>
    </div>
  );
}

export function WidgetCard({ slot, config, spritesBase }: { slot: WidgetSlot; config: WidgetConfig; spritesBase: string }) {
  const title = config.showNickname && slot.nickname ? slot.nickname : slot.speciesName;

  return (
    // Contenedor circular: el contenido va en columna centrada para caber dentro del círculo
    <div
      className={cx(
        "anim-slot-in relative flex h-[210px] w-[210px] flex-col items-center justify-center rounded-full border px-8 text-center text-text",
        slot.fainted && config.faintEffect && "opacity-60 grayscale",
      )}
      style={surface(config.opacity)}
    >
      {config.opacity > 0 && <PokeballSilhouette opacity={(config.opacity / 100) * POKEBALL_RATIO} />}

      <div className="relative w-full max-w-[140px]">
        <div className="truncate text-base font-bold leading-tight drop-shadow">{title}</div>
        {config.showNickname && slot.nickname && <div className="truncate text-[10px] text-muted">{slot.speciesName}</div>}
      </div>

      <div className="relative my-1 flex h-[90px] w-full items-center justify-center">
        <Sprite base={spritesBase} spriteId={slot.spriteId} shiny={slot.shiny} animated={config.animated} alt={slot.speciesName} className="max-h-[90px] max-w-[130px]" />
        {slot.fainted && (
          <span className="absolute bottom-0 rounded bg-bad/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">DEBILITADO</span>
        )}
      </div>

      {config.showTypes && (
        <div className="relative flex justify-center gap-1">
          {slot.types.map((t) => (
            <TypeBadge key={t} type={t} className="py-0.5" />
          ))}
        </div>
      )}
    </div>
  );
}

/** Silueta de pokébola detrás del Pokémon (franja central y botón recortados). */
function PokeballSilhouette({ opacity }: { opacity: number }) {
  const mask = useId();
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[170px] w-[170px] -translate-x-1/2 -translate-y-1/2 text-white" style={{ opacity }}>
      <defs>
        <mask id={mask}>
          <rect width="100" height="100" fill="white" />
          <rect x="0" y="45.5" width="100" height="9" fill="black" />
          <circle cx="50" cy="50" r="16" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="48" fill="currentColor" mask={`url(#${mask})`} />
      <circle cx="50" cy="50" r="9" fill="currentColor" />
    </svg>
  );
}
