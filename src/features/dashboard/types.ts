import type { RunOverview } from "@/features/run/types";
import type { SlotView } from "@/features/team/types";

/** Todo lo que el panel necesita en una sola lectura. */
export interface DashboardState {
  appName: string;
  authEnabled: boolean;
  spritesBase: string;
  run: RunOverview;
  team: SlotView[];
}
