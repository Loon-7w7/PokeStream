// Contrato público entre el servidor y el widget de OBS. Puro.
// Si cambias su forma de manera incompatible, sube `v` (los widgets abiertos en OBS
// pueden estar corriendo una versión anterior hasta que se recarguen).
import type { WidgetConfig } from "@/features/run/types";

export const WIDGET_CONTRACT_VERSION = 4;

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
  /** Muertes para el contador; null = no se muestra (Nuzlocke apagado o contador desactivado). */
  deaths: number | null;
}

/**
 * Eventos SSE de /api/stream/[token].
 * `revoked`: el token se regeneró (no vuelve). `blocked`: el admin bloqueó al dueño (vuelve al desbloquearlo).
 */
export type WidgetEvent =
  | { event: "state"; data: WidgetState }
  | { event: "revoked"; data: Record<string, never> }
  | { event: "blocked"; data: Record<string, never> };

/** Quién abre el stream: el widget en OBS o una pestaña del panel (sincronización). */
export type StreamClient = "obs" | "panel";
