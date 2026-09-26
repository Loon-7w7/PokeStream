// SSE del widget. La lógica vive en features/widget.
import { createWidgetStream } from "@/features/widget";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  return (await createWidgetStream(token, req.signal)) ?? new Response("Token inválido", { status: 404 });
}
