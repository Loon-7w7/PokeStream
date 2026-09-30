import type { RunOverview } from "@/features/run/types";
import type { SlotView, StorageView } from "@/features/team/types";
import type { WidgetSlot } from "@/features/widget/types";

/** Todo lo que el panel necesita en una sola lectura. */
export interface DashboardState {
  appName: string;
  authEnabled: boolean;
  spritesBase: string;
  /** Enlace de donación ("" = sin botón). */
  kofiUrl: string;
  run: RunOverview;
  team: SlotView[];
  /** Caja y Muertos. */
  storage: StorageView;
  /** Lo que ve el widget (para el editor de posiciones). */
  widgetSlots: WidgetSlot[];
  /** Muertes que muestra el contador del widget (0 si está oculto). */
  widgetDeaths: number;
}
