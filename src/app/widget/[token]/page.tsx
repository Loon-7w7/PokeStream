// Fuente de navegador para OBS (1920x1080, fondo transparente).
import { notFound } from "next/navigation";
import { env } from "@/core/config/env";
import { getWidgetStateByToken } from "@/features/widget";
import { Widget } from "@/features/widget/ui";

export const dynamic = "force-dynamic";

export default async function WidgetPage(props: { params: Promise<{ token: string }>; searchParams: Promise<{ preview?: string }> }) {
  const [{ token }, { preview }] = await Promise.all([props.params, props.searchParams]);
  const state = await getWidgetStateByToken(token);
  if (!state) notFound();
  return <Widget token={token} preview={preview === "1"} initial={state} spritesBase={env.SPRITES_BASE_URL} />;
}
