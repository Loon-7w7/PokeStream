"use client";
import { useState } from "react";
import { useAction } from "@/core/ui/actions";
import { exportShowdown } from "../actions";

/** Botón: copia un solo Pokémon en formato Showdown. type="button" para no enviar el formulario donde se inserte. */
export function CopySlotButton({ position }: { position: number }) {
  const { run } = useAction();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="rounded-lg border border-line px-3 py-2 text-sm hover:border-accent"
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
