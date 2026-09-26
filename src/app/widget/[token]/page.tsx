// Página que se agrega a OBS como "Fuente de navegador" (1920x1080).
import { notFound } from "next/navigation";
import { Widget } from "@/components/widget/Widget";
import { getRunIdByToken, getWidgetState } from "@/lib/run";
import { DEFAULT_SPRITES_BASE_URL } from "@/lib/sprites";

export const dynamic = "force-dynamic";

export default async function WidgetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const runId = await getRunIdByToken(token);
  const state = runId ? await getWidgetState(runId) : null;
  if (!state) notFound();
  return (
    <Widget token={token} initial={state} spritesBase={process.env.SPRITES_BASE_URL || DEFAULT_SPRITES_BASE_URL} />
  );
}
