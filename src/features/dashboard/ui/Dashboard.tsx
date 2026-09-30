"use client";
// Composición del panel. El estado viene del servidor (props); las acciones hacen refresh()
// y Next re-renderiza con datos nuevos. Cambios desde otra pestaña llegan por SSE -> router.refresh().
import { CircleAlert, X } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ActionProvider, useAction } from "@/core/ui/actions";
import { RunHeader } from "@/features/run/ui";
import { CopySlotButton, ShowdownBox } from "@/features/showdown/ui";
import { NewGameButton, StoragePanel, TeamSection } from "@/features/team/ui";
import { WidgetSettings } from "@/features/widget/ui";
import type { DashboardState } from "../types";
import { Footer } from "./Footer";

export function Dashboard({ state }: { state: DashboardState }) {
  return (
    <ActionProvider>
      <LiveSync token={state.run.widgetToken} />
      <div className="flex min-h-screen flex-col bg-bg text-text">
        <RunHeader info={state.run.info} appName={state.appName} authEnabled={state.authEnabled} actions={<NewGameButton />} />
        <ErrorBanner />
        <main className="mx-auto grid w-full max-w-[1500px] flex-1 content-start gap-5 px-4 py-5 lg:grid-cols-[1fr_380px]">
          <div className="flex min-w-0 flex-col gap-5">
            <TeamSection
              slots={state.team}
              spritesBase={state.spritesBase}
              nuzlocke={state.run.info.nuzlocke}
              renderEditExtras={(slot) => <CopySlotButton position={slot.position} />}
            />
            <StoragePanel storage={state.storage} team={state.team} nuzlocke={state.run.info.nuzlocke} spritesBase={state.spritesBase} />
          </div>
          <aside className="flex flex-col gap-5">
            <WidgetSettings
              config={state.run.config}
              widgetToken={state.run.widgetToken}
              slots={state.widgetSlots}
              deaths={state.widgetDeaths}
              nuzlocke={state.run.info.nuzlocke}
              spritesBase={state.spritesBase}
            />
            <ShowdownBox />
          </aside>
        </main>
        <Footer kofiUrl={state.kofiUrl} />
      </div>
    </ActionProvider>
  );
}

function ErrorBanner() {
  const { error, clearError } = useAction();
  if (!error) return null;
  return (
    <div className="mx-auto mt-4 max-w-[1500px] px-4">
      <div role="alert" className="flex items-center gap-2 rounded-lg border border-bad/40 bg-bad/10 px-4 py-2 text-sm text-bad">
        <CircleAlert className="size-4 shrink-0" />
        <span className="flex-1">{error}</span>
        <button onClick={clearError} aria-label="Cerrar" className="rounded p-1 hover:bg-bad/15">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Escucha el stream del widget: si otra pestaña/dispositivo cambia algo, refresca el panel. */
function LiveSync({ token }: { token: string }) {
  const router = useRouter();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const es = new EventSource(`/api/stream/${encodeURIComponent(token)}`);
    es.addEventListener("state", () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 150); // agrupa ráfagas de cambios
    });
    return () => {
      clearTimeout(timer);
      es.close();
    };
  }, [token, router]);
  return null;
}
