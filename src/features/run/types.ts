// Tipos públicos de la feature "run" (una partida/sesión de stream). Puros.

export interface RunInfo {
  title: string;
  game: string;
  ruleset: string;
  /** Modo Nuzlocke: un Pokémon debilitado no puede revivir. */
  nuzlocke: boolean;
}

/** Configuración visual del widget. Vive en la tabla Run (una config por run). */
export interface WidgetConfig {
  layout: "hud-bottom";
  opacity: number; // 0-100
  scale: number; // 50-150 %
  gap: number; // px
  pokeballOpacity: number; // 0-100, 0 = oculta
  showNickname: boolean;
  showTypes: boolean;
  faintEffect: boolean;
  animated: boolean;
}

export type WidgetConfigPatch = Partial<Omit<WidgetConfig, "layout">>;

export interface HistoryItem {
  id: string;
  message: string;
  createdAt: string; // ISO
}

export interface RunOverview {
  id: string;
  info: RunInfo;
  config: WidgetConfig;
  widgetToken: string;
  history: HistoryItem[];
}
