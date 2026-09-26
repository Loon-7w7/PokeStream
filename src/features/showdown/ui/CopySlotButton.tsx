"use client";
import { useState } from "react";
import { useAction } from "@/core/ui/actions";
import { exportShowdown } from "../actions";

/** Opción de menú: copia un solo Pokémon en formato Showdown. */
export function CopySlotButton({ position }: { position: number }) {
  const { run } = useAction();
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        const res = await run(() => exportShowdown(position));
        if (!res?.ok) return;
        await navigator.clipboard.writeText(res.data);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? "¡Copiado!" : "Copiar para Showdown"}
    </button>
  );
}
