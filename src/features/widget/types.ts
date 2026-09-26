// Contrato público entre el servidor y el widget de OBS. Puro.
// Si cambias su forma de manera incompatible, sube `v` (los widgets abiertos en OBS
// pueden estar corriendo una versión anterior hasta que se recarguen).
import type { WidgetConfig } from "@/features/run/types";

export const WIDGET_CONTRACT_VERSION = 3;

export interface WidgetSlot {
  position: number;
  speciesName: string;
  spriteId: string;
  nickname: string;
  types: string[];
  shiny: boolean;
  fainted: boolean;
}

export interface WidgetState {
  v: typeof WIDGET_CONTRACT_VERSION;
  config: WidgetConfig;
  /** Solo slots con Pokémon. Nunca incluye datos privados (tokens, movimientos, EVs…). */
  slots: WidgetSlot[];
}

/** Eventos SSE de /api/stream/[token]. */
export type WidgetEvent = { event: "state"; data: WidgetState } | { event: "revoked"; data: Record<string, never> };
