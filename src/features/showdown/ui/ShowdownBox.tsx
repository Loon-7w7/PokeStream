"use client";
// Exportar el equipo a texto de Showdown (copiar / descargar) e importar a la caja desde un texto pegado.
import { useState } from "react";
import { useAction } from "@/core/ui/actions";
import { Modal } from "@/core/ui/Modal";
import { exportShowdown, importShowdown } from "../actions";

export function ShowdownBox() {
  const { run } = useAction();
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 5000);
  };

  const exportTeam = async (download: boolean) => {
    const res = await run(() => exportShowdown());
    if (!res?.ok) return;
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

  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <h2 className="mb-3 font-semibold">Pokémon Showdown</h2>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <button onClick={() => exportTeam(false)} className="rounded-lg bg-accent px-3 py-2 font-semibold text-bg hover:brightness-110">
          Exportar
        </button>
        <button onClick={() => exportTeam(true)} className="rounded-lg border border-line px-3 py-2 hover:border-accent">
          Descargar .txt
        </button>
        <button onClick={() => setImporting(true)} className="rounded-lg border border-line px-3 py-2 hover:border-accent">
          Importar
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-accent">{msg}</p>}

      {importing && (
        <ImportDialog
          onClose={() => setImporting(false)}
          onDone={(m) => {
            setImporting(false);
            flash(m);
          }}
        />
      )}
    </div>
  );
}

/** Ventana para pegar un texto de Showdown. Todo lo importado va a la caja. */
function ImportDialog({ onClose, onDone }: { onClose: () => void; onDone: (message: string) => void }) {
  const { run, pending } = useAction();
  const [text, setText] = useState("");

  const submit = async () => {
    const res = await run(() => importShowdown(text));
    if (!res?.ok) return;
    const { imported, warnings } = res.data;
    onDone(`${imported} Pokémon enviados a la caja.${warnings.length ? ` Avisos: ${warnings.join(" · ")}` : ""}`);
  };

  return (
    <Modal title="Importar desde Showdown" onClose={onClose} wide>
      <p className="mb-2 text-xs text-muted">Pega uno o varios Pokémon en formato Showdown. Irán directo a la caja; tu equipo no cambia.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
        spellCheck={false}
        rows={12}
        aria-label="Texto de Showdown"
        placeholder={"Garchomp @ Choice Scarf\nAbility: Rough Skin\n- Earthquake\n\nPikachu\n- Thunderbolt"}
        className="w-full resize-y rounded-lg border border-line bg-bg p-2 font-mono text-xs outline-none focus:border-accent"
      />
      <div className="mt-3 flex justify-end gap-2 text-sm">
        <button onClick={onClose} className="rounded-lg border border-line px-4 py-2">
          Cancelar
        </button>
        <button disabled={pending || !text.trim()} onClick={submit} className="rounded-lg bg-accent px-4 py-2 font-semibold text-bg disabled:opacity-50">
          Enviar a la caja
        </button>
      </div>
    </Modal>
  );
}
