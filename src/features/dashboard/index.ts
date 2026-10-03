import "server-only";
import { redirect } from "next/navigation";
import { env } from "@/core/config/env";
import { getCurrentUser, isAuthEnabled, isCurrentUserAdmin, isSignedIn } from "@/features/auth";
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
  // Antes de leer: un cambio publicado después de este instante puede no estar en este render
  const renderedAt = Date.now();
  const run = await getRunOverview();
  const [team, storage, widget] = await Promise.all([getTeamView(), getStorageView(), getWidgetState(run.id)]);
  return {
    renderedAt,
    appName: env.APP_NAME,
    userEmail: isAuthEnabled() ? await getCurrentUser() : null,
    isAdmin: await isCurrentUserAdmin(),
    spritesBase: env.SPRITES_BASE_URL,
    kofiUrl: env.KOFI_URL,
    run,
    team,
    storage,
    widgetSlots: widget?.slots ?? [],
    widgetDeaths: widget?.deaths ?? 0,
  };
}
