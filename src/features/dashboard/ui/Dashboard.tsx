"use client";
// Composición del panel. El estado viene del servidor (props); las acciones hacen refresh()
// y Next re-renderiza con datos nuevos. Cambios desde otra pestaña llegan por SSE -> router.refresh().
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ActionProvider, useAction } from "@/core/ui/actions";
import { HistoryList, RunHeader } from "@/features/run/ui";
import { CopySlotButton, ShowdownBox } from "@/features/showdown/ui";
import { TeamSection } from "@/features/team/ui";
import { WidgetSettings } from "@/features/widget/ui";
import type { DashboardState } from "../types";

export function Dashboard({ state }: { state: DashboardState }) {
  return (
    <ActionProvider>
      <LiveSync token={state.run.widgetToken} />
      <div className="min-h-screen bg-bg text-text">
        <RunHeader info={state.run.info} appName={state.appName} authEnabled={state.authEnabled} />
        <ErrorBanner />
        <main className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 lg:grid-cols-[1fr_380px]">
          <TeamSection
            slots={state.team}
            spritesBase={state.spritesBase}
            nuzlocke={state.run.info.nuzlocke}
            renderMenuExtras={(slot) => <CopySlotButton position={slot.position} />}
          />
          <aside className="flex flex-col gap-5">
            <WidgetSettings config={state.run.config} widgetToken={state.run.widgetToken} slots={state.widgetSlots} spritesBase={state.spritesBase} />
            <ShowdownBox />
            <HistoryList history={state.run.history} />
          </aside>
        </main>
      </div>
    </ActionProvider>
  );
}

function ErrorBanner() {
  const { error, clearError } = useAction();
  if (!error) return null;
  return (
    <div className="mx-auto mt-4 max-w-[1500px] px-4">
      <div role="alert" className="flex items-center justify-between rounded-lg border border-bad/40 bg-bad/10 px-4 py-2 text-sm text-bad">
        {error}
        <button onClick={clearError} aria-label="Cerrar" className="px-2">
          ✕
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
