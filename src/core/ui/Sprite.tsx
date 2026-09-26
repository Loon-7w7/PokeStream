"use client";
// <img> de Showdown con respaldo: si una variante falla (404), prueba la siguiente.
import { useState } from "react";
import { spriteCandidates } from "../pokedex/sprites";
import { cx } from "./cx";

type Props = {
  base: string;
  spriteId: string;
  shiny?: boolean;
  animated?: boolean;
  alt: string;
  className?: string;
};

export function Sprite(props: Props) {
  // key: al cambiar de Pokémon se reinicia el índice de respaldo
  const key = `${props.spriteId}|${props.shiny}|${props.animated}`;
  return <SpriteInner key={key} {...props} />;
}

function SpriteInner({ base, spriteId, shiny, animated, alt, className }: Props) {
  const [i, setI] = useState(0);
  const urls = spriteCandidates(base, spriteId, { shiny, animated });
  if (!spriteId || i >= urls.length) {
    return <div className={cx("flex items-center justify-center text-muted/50 text-xs", className)}>?</div>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={urls[i]}
      alt={alt}
      loading="lazy"
      draggable={false}
      onError={() => setI((n) => n + 1)}
      className={cx("object-contain pixelated", className)}
    />
  );
}
