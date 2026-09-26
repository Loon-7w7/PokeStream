// Panel de control (protegido por src/proxy.ts cuando ADMIN_TOKEN está definido).
import { Panel } from "@/components/panel/Panel";
import { isAuthDisabled } from "@/lib/auth";
import { getRunState } from "@/lib/run";
import { DEFAULT_SPRITES_BASE_URL } from "@/lib/sprites";

export const dynamic = "force-dynamic";

export default async function Home() {
  const state = await getRunState();
  return (
    <Panel
      initial={state}
      spritesBase={process.env.SPRITES_BASE_URL || DEFAULT_SPRITES_BASE_URL}
      appName={process.env.APP_NAME || "PartyHUD"}
      authEnabled={!isAuthDisabled()}
    />
  );
}
