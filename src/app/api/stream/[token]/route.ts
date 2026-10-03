// SSE del widget. La lógica vive en features/widget.
import { createWidgetStream } from "@/features/widget";
import { STREAM_CLIENTS, type StreamClient } from "@/features/widget/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const param = new URL(req.url).searchParams.get("client");
  const client: StreamClient = STREAM_CLIENTS.find((c) => c === param) ?? "obs";
  return (await createWidgetStream(token, req.signal, client)) ?? new Response("Token inválido", { status: 404 });
}
