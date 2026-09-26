// SSE: el widget (y el panel) se conectan aquí y reciben el estado completo
// al conectar y cada vez que algo cambia. Evento "state" = JSON de WidgetState.
import { subscribeRun } from "@/lib/events";
import { getRunIdByToken, getWidgetState } from "@/lib/run";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const runId = await getRunIdByToken(token);
  if (!runId) return new Response("Token inválido", { status: 404 });

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const close = () => {
        if (closed) return;
        closed = true;
        cleanup();
        try {
          controller.close();
        } catch {}
      };

      const pushState = async () => {
        // Si el token se regeneró, cortar la conexión vieja
        const run = await prisma.run.findUnique({ where: { id: runId }, select: { widgetToken: true } });
        if (!run || run.widgetToken !== token) {
          send("revoked", {});
          return close();
        }
        const state = await getWidgetState(runId);
        if (state) send("state", state);
      };

      const unsubscribe = subscribeRun(runId, () => void pushState());
      // Comentario periódico para que proxies/OBS no cierren la conexión
      const ping = setInterval(() => !closed && controller.enqueue(encoder.encode(`: ping\n\n`)), 25000);
      cleanup = () => {
        unsubscribe();
        clearInterval(ping);
      };
      req.signal.addEventListener("abort", close);

      controller.enqueue(encoder.encode(`retry: 2000\n\n`));
      await pushState();
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // evita buffering en Nginx
    },
  });
}
