"use client";
import * as A from "@/app/actions";
import type { RunState } from "@/lib/types";
import type { Run } from "./Panel";

export function RunHeader(props: { state: RunState; appName: string; authEnabled: boolean; run: Run; pending: boolean }) {
  const { state, run } = props;
  const save = (field: "title" | "game" | "ruleset", value: string) => {
    if (value !== state[field]) run(() => A.updateRunInfo({ [field]: value }));
  };

  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-accent-2 bg-gradient-to-b from-accent-2 from-50% to-white to-50%">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-bg bg-white" />
          </span>
          <span className="text-lg font-bold">{props.appName}</span>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <InlineInput
            value={state.title}
            placeholder="Título de la run"
            className="min-w-[220px] flex-1 text-base font-semibold"
            onCommit={(v) => save("title", v)}
          />
          <InlineInput value={state.game} placeholder="Juego" className="w-44" onCommit={(v) => save("game", v)} />
          <InlineInput
            value={state.ruleset}
            placeholder="Reglas (ej. Nuzlocke Hardcore)"
            className="w-60"
            onCommit={(v) => save("ruleset", v)}
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className={props.pending ? "text-warn" : "text-ok"}>● {props.pending ? "Guardando…" : "Sincronizado"}</span>
          {props.authEnabled && (
            <form action={A.logout}>
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
      onBlur={(e) => props.onCommit(e.currentTarget.value.trim())}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className={`rounded-md border border-transparent bg-transparent px-2 py-1 outline-none placeholder:text-muted/60 hover:border-line focus:border-accent ${props.className ?? ""}`}
    />
  );
}
