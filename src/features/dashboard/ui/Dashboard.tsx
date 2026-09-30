"use client";
// Composición del panel. El estado viene del servidor (props); las acciones hacen refresh()
// y Next re-renderiza con datos nuevos. Cambios desde otra pestaña llegan por SSE -> router.refresh().
import { ChevronLeft, ChevronRight, CircleAlert, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionProvider, useAction } from "@/core/ui/actions";
import { cx } from "@/core/ui/cx";
import { RunHeader } from "@/features/run/ui";
import { CopySlotButton, ShowdownBox } from "@/features/showdown/ui";
import { NewGameButton, StoragePanel, TeamSection } from "@/features/team/ui";
import { GuidedTour } from "@/features/tour/ui";
import { WidgetSettings } from "@/features/widget/ui";
import type { DashboardState } from "../types";
import { Footer } from "./Footer";

export function Dashboard({ state }: { state: DashboardState }) {
  // Panel lateral (widget + Showdown) plegable en escritorio. En móvil va debajo y siempre visible.
  const [sideOpen, setSideOpen] = useState(true);

  return (
    <ActionProvider>
      <LiveSync token={state.run.widgetToken} />
      <div className="flex min-h-screen flex-col overflow-x-clip bg-bg text-text">
        <RunHeader
          info={state.run.info}
          appName={state.appName}
          authEnabled={state.authEnabled}
          actions={
            <>
              {state.isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-accent"
                >
                  <ShieldCheck className="size-4" />
                  Admin
                </Link>
              )}
              <GuidedTour onStart={() => setSideOpen(true)} />
              <NewGameButton />
            </>
          }
        />
        <ErrorBanner />
        <main
          className={cx(
            "mx-auto grid w-full max-w-[1500px] flex-1 content-start gap-5 px-4 py-5 transition-[grid-template-columns,column-gap] duration-300",
            sideOpen ? "lg:grid-cols-[1fr_380px]" : "lg:grid-cols-[1fr_0px] lg:gap-x-0",
          )}
        >
          <div className="flex min-w-0 flex-col gap-5">
            <TeamSection
              slots={state.team}
              spritesBase={state.spritesBase}
              nuzlocke={state.run.info.nuzlocke}
              renderEditExtras={(slot) => <CopySlotButton position={slot.position} />}
            />
            <StoragePanel storage={state.storage} team={state.team} nuzlocke={state.run.info.nuzlocke} spritesBase={state.spritesBase} />
          </div>
          <aside
            className={cx(
              "relative flex flex-col gap-5 transition-[translate,opacity,visibility] duration-300 lg:w-[380px]",
              !sideOpen && "lg:invisible lg:translate-x-8 lg:opacity-0",
            )}
          >
            <button
              data-tour="side-toggle"
              onClick={() => setSideOpen(false)}
              title="Ocultar el panel lateral"
              aria-label="Ocultar el panel lateral"
              className="absolute -left-6 top-3 z-10 hidden size-7 place-items-center rounded-full border border-line bg-panel text-muted shadow hover:border-accent hover:text-accent lg:grid"
            >
              <ChevronRight className="size-4" />
            </button>
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
        {!sideOpen && (
          <button
            onClick={() => setSideOpen(true)}
            title="Mostrar el panel lateral"
            className="anim-slot-in fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2 rounded-l-xl border border-r-0 border-line bg-panel px-1.5 py-3 text-sm text-muted shadow-lg hover:border-accent hover:text-accent lg:flex"
          >
            <ChevronLeft className="size-4" />
            <span className="[writing-mode:vertical-rl]">Widget y Showdown</span>
          </button>
        )}
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
    const es = new EventSource(`/api/stream/${encodeURIComponent(token)}?client=panel`);
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
