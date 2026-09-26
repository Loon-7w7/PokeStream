"use client";
// Widget de OBS: fondo transparente, 1920x1080, se actualiza por SSE.
import { useEffect, useRef, useState } from "react";
import { Sprite } from "@/components/Sprite";
import { TYPE_COLORS, TYPE_ES, cx, hpColor, hpPercent } from "@/lib/ui";
import type { WidgetConfig, WidgetSlot, WidgetState } from "@/lib/types";

export function Widget({ token, initial, spritesBase }: { token: string; initial: WidgetState; spritesBase: string }) {
  const [state, setState] = useState<WidgetState | null>(initial);

  useEffect(() => {
    const es = new EventSource(`/api/stream/${token}`);
    es.addEventListener("state", (e) => setState(JSON.parse((e as MessageEvent).data)));
    es.addEventListener("revoked", () => {
      setState(null);
      es.close();
    });
    return () => es.close();
  }, [token]);

  if (!state) return null;
  return <HudBottom state={state} spritesBase={spritesBase} />;
}

/** Layout "HUD inferior": fila de tarjetas centrada abajo. */
export function HudBottom({ state, spritesBase }: { state: WidgetState; spritesBase: string }) {
  const { config, slots } = state;
  return (
    <div className="fixed inset-0 flex items-end justify-center overflow-hidden pb-6">
      <div
        className="flex items-end"
        style={{ gap: config.gap, transform: `scale(${config.scale / 100})`, transformOrigin: "bottom center" }}
      >
        {slots.map((s) => (
          <WidgetCard key={`${s.position}-${s.speciesName}`} slot={s} config={config} spritesBase={spritesBase} />
        ))}
      </div>
    </div>
  );
}

function WidgetCard({ slot, config, spritesBase }: { slot: WidgetSlot; config: WidgetConfig; spritesBase: string }) {
  // key del padre incluye la especie: al reemplazar se re-monta y anima la entrada.
  // Animación de golpe cuando bajan los PS
  const prevHp = useRef(slot.hpCurrent);
  const [hitKey, setHitKey] = useState(0);
  useEffect(() => {
    if (slot.hpCurrent < prevHp.current) setHitKey((k) => k + 1);
    prevHp.current = slot.hpCurrent;
  }, [slot.hpCurrent]);

  const title = config.showNickname && slot.nickname ? slot.nickname : slot.speciesName;
  const faded = slot.fainted && config.faintEffect;
  const pct = hpPercent(slot.hpCurrent, slot.hpMax);

  return (
    <div
      className={cx("anim-slot-in relative w-[250px] rounded-2xl border p-3 text-text", faded && "grayscale opacity-60")}
      style={{
        background: `rgba(12, 17, 27, ${config.opacity / 100})`,
        borderColor: `rgba(56, 208, 245, ${0.15 + (config.opacity / 100) * 0.35})`,
        boxShadow: config.opacity > 0 ? "0 8px 30px rgba(0,0,0,0.35)" : "none",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-lg font-bold leading-tight drop-shadow">{title}</div>
          {config.showNickname && slot.nickname && (
            <div className="truncate text-xs text-muted">{slot.speciesName}</div>
          )}
        </div>
        {config.showLevel && (
          <span className="shrink-0 rounded-md bg-accent/15 px-2 py-0.5 font-mono text-xs font-semibold text-accent">
            Nv.{slot.level}
          </span>
        )}
      </div>

      <div key={hitKey} className={cx("my-1 flex h-[110px] items-center justify-center", hitKey > 0 && "anim-hit")}>
        <Sprite
          base={spritesBase}
          spriteId={slot.spriteId}
          shiny={slot.shiny}
          animated={config.animated}
          alt={slot.speciesName}
          className="max-h-[110px] max-w-[200px]"
        />
        {slot.fainted && (
          <span className="absolute right-3 top-14 rounded bg-bad/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
            DEBILITADO
          </span>
        )}
      </div>

      {config.showHp && (
        <div>
          <div className="mb-1 flex justify-between font-mono text-xs">
            <span className="text-muted">PS</span>
            <span>
              {slot.hpCurrent}/{slot.hpMax}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-[width,background-color] duration-700 ease-out"
              style={{ width: `${pct}%`, background: hpColor(slot.hpCurrent, slot.hpMax) }}
            />
          </div>
        </div>
      )}

      {config.showTypes && (
        <div className="mt-2 flex gap-1.5">
          {slot.types.map((t) => (
            <span
              key={t}
              className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ background: TYPE_COLORS[t] ?? "#555" }}
            >
              {TYPE_ES[t] ?? t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
