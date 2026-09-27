import type { ReactNode } from "react";

/**
 * Pantalla completa con forma de pokébola cerrada: la costura cruza toda la pantalla
 * y `center` ocupa el botón central. `children` va debajo (login, 404…).
 */
export function PokeballStage({ center, children }: { center: ReactNode; children: ReactNode }) {
  return (
    <main className="relative min-h-[max(100svh,640px)] overflow-hidden bg-bg text-text">
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 size-[min(92vmin,760px)] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-line/70 bg-[linear-gradient(to_bottom,rgb(247_37_79/0.09)_50%,transparent_50%)]"
      />
      <div aria-hidden className="anim-seam absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 border-y-2 border-line bg-panel" />

      <div className="absolute left-1/2 top-1/2 flex w-full max-w-md -translate-x-1/2 -translate-y-14 flex-col items-center px-4 text-center">
        <div className="anim-pokeball-button grid size-28 place-items-center rounded-full border-[6px] border-line bg-panel shadow-[0_0_0_10px_var(--color-bg)]">
          <div className="grid size-20 place-items-center rounded-full border-2 border-line/70 bg-card">{center}</div>
        </div>
        <div className="mt-10 w-full">{children}</div>
      </div>
    </main>
  );
}
