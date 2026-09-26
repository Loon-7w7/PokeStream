"use client";
// Exportar el equipo a texto de Showdown (copiar / descargar) e importar uno pegado.
import { useState } from "react";
import { useAction } from "@/core/ui/actions";
import { exportShowdown, importShowdown } from "../actions";

export function ShowdownBox() {
  const { run, pending } = useAction();
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 5000);
  };

  const exportTeam = async (download: boolean) => {
    const res = await run(() => exportShowdown());
    if (!res?.ok) return;
    setText(res.data);
    if (download) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([res.data], { type: "text/plain" }));
      a.download = "equipo-showdown.txt";
      a.click();
      URL.revokeObjectURL(a.href);
      flash("Archivo descargado.");
    } else {
      await navigator.clipboard.writeText(res.data);
      flash("Equipo copiado. Pégalo en el Teambuilder de Showdown (Import from text).");
    }
  };

  const importTeam = async () => {
    if (!text.trim()) return flash("Pega primero un equipo de Showdown en el cuadro.");
    if (!confirm("Esto reemplaza los 6 slots actuales. ¿Continuar?")) return;
    const res = await run(() => importShowdown(text));
    if (res?.ok) flash(`Equipo importado.${res.data.warnings.length ? ` Avisos: ${res.data.warnings.join(" · ")}` : ""}`);
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
        <button disabled={pending} onClick={importTeam} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent disabled:opacity-50">
          Importar
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        rows={6}
        aria-label="Texto de Showdown"
        placeholder={"Pega aquí un equipo de Showdown para importarlo…\n\nGarchomp @ Choice Scarf\nAbility: Rough Skin\n- Earthquake"}
        className="mt-3 w-full resize-y rounded-lg border border-line bg-bg p-2 font-mono text-xs outline-none focus:border-accent"
      />
      {msg && <p className="mt-2 text-xs text-accent">{msg}</p>}
    </div>
  );
}
