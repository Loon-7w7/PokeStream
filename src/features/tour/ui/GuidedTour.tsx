"use client";
// Tour guiado del panel (React Joyride). Arranca solo la primera vez y se repite con el botón «?».
// "Ya visto" se guarda en localStorage: es una comodidad por navegador, no estado del servidor.
import { CircleHelp, X } from "lucide-react";
import { useEffect } from "react";
import { EVENTS, useJoyride, type EventData, type TooltipRenderProps } from "react-joyride";
import { TOUR_STEPS } from "./steps";

const SEEN_KEY = "partyhud:tour-seen";

function wasSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true; // sin almacenamiento no se puede recordar: mejor no molestar en cada visita
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {}
}

export function GuidedTour() {
  const { controls, Tour } = useJoyride({
    steps: TOUR_STEPS,
    continuous: true,
    scrollToFirstStep: true,
    tooltipComponent: TourTooltip,
    onEvent: (e: EventData) => e.type === EVENTS.TOUR_END && markSeen(),
    options: {
      skipBeacon: true,
      overlayClickAction: false,
      dismissKeyAction: false,
      overlayColor: "rgba(0, 0, 0, 0.6)",
      arrowColor: "#101b2e", // --color-panel
      spotlightRadius: 16,
      spotlightPadding: 8,
      zIndex: 100,
    },
  });

  useEffect(() => {
    if (!wasSeen()) controls.start();
    // Solo al montar el panel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <button
        data-tour="tour"
        onClick={() => controls.start(0)}
        title="Ver el tour del panel"
        aria-label="Ver el tour del panel"
        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-sm text-muted hover:border-accent hover:text-accent"
      >
        <CircleHelp className="size-4" />
      </button>
      {Tour}
    </>
  );
}

/** Globo del tour con el estilo del panel. */
function TourTooltip({ index, size, isLastStep, step, backProps, primaryProps, skipProps, tooltipProps }: TooltipRenderProps) {
  return (
    <div {...tooltipProps} className="w-[360px] max-w-[calc(100vw-32px)] rounded-2xl border border-line bg-panel p-4 text-text shadow-2xl">
      <div className="mb-2 flex items-start gap-2">
        <h3 className="flex-1 font-semibold">{step.title}</h3>
        {!isLastStep && (
          <button {...skipProps} aria-label="Saltar el tour" title="Saltar el tour" className="-m-1 rounded p-1 text-muted hover:bg-card hover:text-text">
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="text-sm leading-relaxed text-muted">{step.content}</div>

      <div className="mt-4 flex items-center gap-2 text-sm">
        <div className="flex gap-1" aria-label={`Paso ${index + 1} de ${size}`}>
          {Array.from({ length: size }, (_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-accent" : "w-1.5 bg-line"}`} />
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          {index > 0 && (
            <button {...backProps} aria-label="Atrás" title="Atrás" className="rounded-lg border border-line px-3 py-1.5 hover:border-accent">
              Atrás
            </button>
          )}
          <button
            {...primaryProps}
            aria-label={isLastStep ? "Terminar" : "Siguiente"}
            title={isLastStep ? "Terminar" : "Siguiente"}
            className="rounded-lg bg-accent px-4 py-1.5 font-semibold text-bg hover:brightness-110"
          >
            {isLastStep ? "¡Entendido!" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
