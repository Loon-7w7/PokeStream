// Tipos compartidos entre servidor, panel y widget. Sin dependencias de runtime.

export type StatID = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
export type StatsTable = Record<StatID, number>;

/** Datos editables de un slot. Los nombres van como ID de Showdown (ej. "heavydutyboots"). */
export interface SlotData {
  position: number; // 0-5
  species: string; // "" = slot vacío
  nickname: string;
  level: number;
  hpCurrent: number;
  hpMax: number;
  ability: string;
  item: string;
  nature: string;
  teraType: string;
  gender: "" | "M" | "F";
  shiny: boolean;
  fainted: boolean;
  moves: string[]; // máx. 4
  evs: StatsTable | null;
  ivs: StatsTable | null;
}

/** Slot enriquecido con nombres legibles para mostrar (lo arma el servidor). */
export interface SlotView extends SlotData {
  speciesName: string;
  spriteId: string;
  types: string[];
  abilityName: string;
  itemName: string;
  natureName: string;
  moveNames: string[];
  evos: { id: string; name: string }[];
}

export interface WidgetConfig {
  layout: "hud-bottom";
  opacity: number; // 0-100
  scale: number; // 80-150
  gap: number; // px
  showHp: boolean;
  showNickname: boolean;
  showLevel: boolean;
  showTypes: boolean;
  faintEffect: boolean;
  animated: boolean;
}

export interface HistoryItem {
  id: string;
  message: string;
  createdAt: string; // ISO
}

/** Estado completo que recibe el panel. */
export interface RunState {
  id: string;
  title: string;
  game: string;
  ruleset: string;
  widgetToken: string;
  config: WidgetConfig;
  slots: SlotView[];
  history: HistoryItem[];
}

/** Lo mínimo que necesita el widget de OBS (no incluye datos privados). */
export interface WidgetSlot {
  position: number;
  speciesName: string;
  spriteId: string;
  nickname: string;
  level: number;
  hpCurrent: number;
  hpMax: number;
  types: string[];
  shiny: boolean;
  fainted: boolean;
}

export interface WidgetState {
  config: WidgetConfig;
  slots: WidgetSlot[]; // solo slots con especie
}

/** Índice ligero de la Pokédex que el panel descarga una vez (/api/dex). */
export interface DexIndex {
  species: DexSpecies[];
  moves: DexEntry[];
  items: DexEntry[];
  abilities: DexEntry[];
  natures: DexEntry[];
  types: string[];
}
export interface DexEntry {
  id: string;
  name: string;
}
export interface DexSpecies extends DexEntry {
  num: number;
  spriteId: string;
  types: string[];
  abilities: string[]; // nombres legibles
}
