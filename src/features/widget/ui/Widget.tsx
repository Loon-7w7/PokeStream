"use client";
// Widget de OBS: fondo transparente, 1920x1080. Solo pinta lo que llega por SSE (sin lógica de negocio).
import { useEffect, useState } from "react";
import { cx } from "@/core/ui/cx";
import { Sprite } from "@/core/ui/Sprite";
import { TypeBadge } from "@/core/ui/TypeBadge";
import type { WidgetConfig } from "@/features/run/types";
import type { WidgetSlot, WidgetState } from "../types";

export function Widget({ token, initial, spritesBase }: { token: string; initial: WidgetState; spritesBase: string }) {
  const [state, setState] = useState<WidgetState | null>(initial);

  useEffect(() => {
    const es = new EventSource(`/api/stream/${encodeURIComponent(token)}`);
    es.addEventListener("state", (e) => setState(JSON.parse((e as MessageEvent).data)));
    es.addEventListener("revoked", () => {
      setState(null);
      es.close();
    });
    return () => es.close();
  }, [token]);

  if (!state) return null;
  // Aquí se elegirán otros layouts (torre lateral, burbujas) según state.config.layout
  return <HudBottom state={state} spritesBase={spritesBase} />;
}

/** Layout "HUD inferior": fila de tarjetas centrada abajo. */
function HudBottom({ state, spritesBase }: { state: WidgetState; spritesBase: string }) {
  const { config, slots } = state;
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

function WidgetCard({ slot, config, spritesBase }: { slot: WidgetSlot; config: WidgetConfig; spritesBase: string }) {
  const title = config.showNickname && slot.nickname ? slot.nickname : slot.speciesName;

  return (
    <div
      className={cx("anim-slot-in relative w-[250px] rounded-2xl border p-3 text-text", slot.fainted && config.faintEffect && "opacity-60 grayscale")}
      style={{
        background: `rgba(16, 27, 46, ${config.opacity / 100})`,
        borderColor: `rgba(53, 184, 243, ${0.15 + (config.opacity / 100) * 0.35})`,
        boxShadow: config.opacity > 0 ? "0 8px 30px rgba(0,0,0,0.35)" : "none",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-lg font-bold leading-tight drop-shadow">{title}</div>
          {config.showNickname && slot.nickname && <div className="truncate text-xs text-muted">{slot.speciesName}</div>}
        </div>
        {config.showLevel && (
          <span className="shrink-0 rounded-md bg-accent/15 px-2 py-0.5 font-mono text-xs font-semibold text-accent">Nv.{slot.level}</span>
        )}
      </div>

      <div className="my-1 flex h-[110px] items-center justify-center">
        <Sprite base={spritesBase} spriteId={slot.spriteId} shiny={slot.shiny} animated={config.animated} alt={slot.speciesName} className="max-h-[110px] max-w-[200px]" />
        {slot.fainted && (
          <span className="absolute right-3 top-14 rounded bg-bad/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">DEBILITADO</span>
        )}
      </div>

      {config.showTypes && (
        <div className="mt-2 flex gap-1.5">
          {slot.types.map((t) => (
            <TypeBadge key={t} type={t} className="py-0.5" />
          ))}
        </div>
      )}
    </div>
  );
}
