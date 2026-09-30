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

/** Posición inicial del contador de muertes: esquina superior izquierda. */
export const DEFAULT_DEATH_COUNTER_POSITION: SlotPoint = { x: 160, y: 60 };

/** Configuración visual del widget. Vive en la tabla Run (una config por run). */
export interface WidgetConfig {
  layout: WidgetLayout;
  /** Posición de cada slot (índice = slot 0-5) en modo libre. */
  slotPositions: SlotPoint[];
  opacity: number; // 0-100 fondo de las tarjetas y, en proporción, la silueta de pokébola
  scale: number; // 50-150 %
  gap: number; // px
  showNickname: boolean;
  showTypes: boolean;
  faintEffect: boolean;
  animated: boolean;
  /** Contador de muertes. Solo se muestra con el Nuzlocke activo. */
  deathCounter: boolean;
  /** Centro del contador (px), en cualquier layout. */
  deathCounterPosition: SlotPoint;
}

export type WidgetConfigPatch = Partial<WidgetConfig>;

export interface RunOverview {
  id: string;
  info: RunInfo;
  config: WidgetConfig;
  widgetToken: string;
}
