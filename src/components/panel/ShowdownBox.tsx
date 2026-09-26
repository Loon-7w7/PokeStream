"use client";
// Exportar el equipo a texto de Showdown (copiar / descargar) e importar uno pegado.
import { useState } from "react";
import * as A from "@/app/actions";
import type { Run } from "./Panel";

export function ShowdownBox({ run, onError }: { run: Run; onError: (msg: string) => void }) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 4000);
  };

  const exportTeam = async (download: boolean) => {
    try {
      const out = await A.exportShowdown();
      if (!out) return flash("El equipo está vacío.");
      setText(out);
      if (download) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([out], { type: "text/plain" }));
        a.download = "equipo-showdown.txt";
        a.click();
        URL.revokeObjectURL(a.href);
        flash("Archivo descargado.");
      } else {
        await navigator.clipboard.writeText(out);
        flash("Equipo copiado. Pégalo en el Teambuilder de Showdown (Import from text).");
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : "No se pudo exportar");
    }
  };

  const importTeam = () => {
    if (!text.trim()) return flash("Pega primero un equipo de Showdown en el cuadro.");
    if (!confirm("Esto reemplaza los 6 slots actuales. ¿Continuar?")) return;
    setBusy(true);
    run(async () => {
      const { state, warnings } = await A.importShowdown(text).finally(() => setBusy(false));
      flash(state ? `Equipo importado.${warnings.length ? " Avisos: " + warnings.join(" · ") : ""}` : warnings.join(" · "));
      return state;
    });
  };

  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <h2 className="mb-3 font-semibold">Pokémon Showdown</h2>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => exportTeam(false)} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-bg">
          Exportar (copiar)
        </button>
        <button onClick={() => exportTeam(true)} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent">
          Descargar .txt
        </button>
        <button disabled={busy} onClick={importTeam} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent disabled:opacity-50">
          Importar
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        rows={6}
        placeholder={"Pega aquí un equipo de Showdown para importarlo…\n\nGarchomp @ Choice Scarf\nAbility: Rough Skin\n- Earthquake"}
        className="mt-3 w-full resize-y rounded-lg border border-line bg-bg p-2 font-mono text-xs outline-none focus:border-accent"
      />
      {msg && <p className="mt-2 text-xs text-accent">{msg}</p>}
    </div>
  );
}
