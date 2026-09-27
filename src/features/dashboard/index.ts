import "server-only";
import { env } from "@/core/config/env";
import { isAuthEnabled } from "@/features/auth";
import { getRunOverview } from "@/features/run";
import { getStorageView, getTeamView } from "@/features/team";
import { getWidgetState } from "@/features/widget";
import type { DashboardState } from "./types";

/**
 * Feature de composición: arma la vista del panel juntando otras features.
 * Es la única que depende de muchas; ninguna feature depende de ella.
 */
export async function getDashboardState(): Promise<DashboardState> {
  const run = await getRunOverview();
  const [team, storage, widget] = await Promise.all([getTeamView(), getStorageView(), getWidgetState(run.id)]);
  return {
    appName: env.APP_NAME,
    authEnabled: isAuthEnabled(),
    spritesBase: env.SPRITES_BASE_URL,
    run,
    team,
    storage,
    widgetSlots: widget?.slots ?? [],
  };
}
