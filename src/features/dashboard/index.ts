import "server-only";
import { redirect } from "next/navigation";
import { env } from "@/core/config/env";
import { isAuthEnabled, isSignedIn } from "@/features/auth";
import { getRunOverview } from "@/features/run";
import { getStorageView, getTeamView } from "@/features/team";
import { getWidgetState } from "@/features/widget";
import type { DashboardState } from "./types";

/**
 * Feature de composición: arma la vista del panel juntando otras features.
 * Es la única que depende de muchas; ninguna feature depende de ella.
 */
export async function getDashboardState(): Promise<DashboardState> {
  // El proxy solo ve que hay cookie; aquí se verifica la firma y el correo.
  if (!(await isSignedIn())) redirect("/login");
  const run = await getRunOverview();
  const [team, storage, widget] = await Promise.all([getTeamView(), getStorageView(), getWidgetState(run.id)]);
  return {
    appName: env.APP_NAME,
    authEnabled: isAuthEnabled(),
    spritesBase: env.SPRITES_BASE_URL,
    kofiUrl: env.KOFI_URL,
    run,
    team,
    storage,
    widgetSlots: widget?.slots ?? [],
    widgetDeaths: widget?.deaths ?? 0,
  };
}
