// Tipos públicos de la feature "run" (una partida/sesión de stream). Puros.

export interface RunInfo {
  /** Modo Nuzlocke: un Pokémon debilitado no puede revivir. */
  nuzlocke: boolean;
}

/** "hud-bottom": fila automática abajo · "free": cada slot en su posición guardada. */
export type WidgetLayout = "hud-bottom" | "free";

/** Centro de un slot en el lienzo del widget (px). */
export interface SlotPoint {
  x: number;
  y: number;
}

export const WIDGET_CANVAS = { width: 1920, height: 1080 } as const;

/** Posiciones iniciales del modo libre: la misma fila que "hud-bottom" (escala 100 %, 12 px). */
export const DEFAULT_SLOT_POSITIONS: SlotPoint[] = Array.from({ length: 6 }, (_, i) => ({ x: 405 + i * 222, y: 951 }));

/** Configuración visual del widget. Vive en la tabla Run (una config por run). */
export interface WidgetConfig {
  layout: WidgetLayout;
  /** Posición de cada slot (índice = slot 0-5) en modo libre. */
  slotPositions: SlotPoint[];
  opacity: number; // 0-100
  scale: number; // 50-150 %
  gap: number; // px
  pokeballOpacity: number; // 0-100, 0 = oculta
  showNickname: boolean;
  showTypes: boolean;
  faintEffect: boolean;
  animated: boolean;
}

export type WidgetConfigPatch = Partial<WidgetConfig>;

export interface RunOverview {
  id: string;
  info: RunInfo;
  config: WidgetConfig;
  widgetToken: string;
}
