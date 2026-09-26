"use client";
import { useAction } from "@/core/ui/actions";
import { Logo } from "@/core/ui/Logo";
import { logout } from "@/features/auth/actions";
import { updateRunInfo } from "../actions";
import type { RunInfo } from "../types";

export function RunHeader({ info, appName, authEnabled }: { info: RunInfo; appName: string; authEnabled: boolean }) {
  const { run, pending } = useAction();
  const save = (field: "title" | "game" | "ruleset", value: string) => {
    if (value !== info[field]) run(() => updateRunInfo({ [field]: value }));
  };

  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Logo size={34} />
          <span className="text-lg font-bold">{appName}</span>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <InlineInput value={info.title} placeholder="Título de la run" className="min-w-[220px] flex-1 text-base font-semibold" onCommit={(v) => save("title", v)} />
          <InlineInput value={info.game} placeholder="Juego" className="w-44" onCommit={(v) => save("game", v)} />
          <InlineInput value={info.ruleset} placeholder="Reglas (ej. Nuzlocke Hardcore)" className="w-60" onCommit={(v) => save("ruleset", v)} />
        </div>

        <button
          onClick={() => run(() => updateRunInfo({ nuzlocke: !info.nuzlocke }))}
          aria-pressed={info.nuzlocke}
          title="En modo Nuzlocke un Pokémon debilitado no puede revivir"
          className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
            info.nuzlocke ? "border-bad bg-bad/15 text-bad" : "border-line text-muted hover:border-bad/60 hover:text-text"
          }`}
        >
          💀 Nuzlocke {info.nuzlocke ? "ON" : "OFF"}
        </button>

        <div className="flex items-center gap-3 text-xs">
          <span className={pending ? "text-warn" : "text-ok"}>● {pending ? "Guardando…" : "Sincronizado"}</span>
          {authEnabled && (
            <form action={logout}>
              <button className="rounded-md border border-line px-2 py-1 text-muted hover:text-text">Salir</button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}

/** Input que guarda al perder el foco o con Enter. */
function InlineInput(props: { value: string; placeholder: string; className?: string; onCommit: (v: string) => void }) {
  return (
    <input
      key={props.value}
      defaultValue={props.value}
      placeholder={props.placeholder}
      aria-label={props.placeholder}
      onBlur={(e) => props.onCommit(e.currentTarget.value.trim())}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className={`rounded-md border border-transparent bg-transparent px-2 py-1 outline-none placeholder:text-muted/60 hover:border-line focus:border-accent ${props.className ?? ""}`}
    />
  );
}
