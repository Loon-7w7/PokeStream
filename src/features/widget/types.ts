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
 * `changed`: solo al panel; avisa de que la run cambió en `at` (ms) sin mandar el estado.
 */
export type WidgetEvent =
  | { event: "state"; data: WidgetState }
  | { event: "changed"; data: { at: number } }
  | { event: "revoked"; data: Record<string, never> }
  | { event: "blocked"; data: Record<string, never> };

/**
 * Quién abre el stream: el widget en OBS, la vista previa del panel (recibe el estado, pero no
 * cuenta como OBS) o una pestaña del panel (solo recibe `changed` para sincronizarse).
 */
export type StreamClient = "obs" | "preview" | "panel";

export const STREAM_CLIENTS: readonly StreamClient[] = ["obs", "preview", "panel"];
