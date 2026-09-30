// SSE del widget. La lógica vive en features/widget.
import { createWidgetStream } from "@/features/widget";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const client = new URL(req.url).searchParams.get("client") === "panel" ? "panel" : "obs";
  return (await createWidgetStream(token, req.signal, client)) ?? new Response("Token inválido", { status: 404 });
}
