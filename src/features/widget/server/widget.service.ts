import "server-only";
import { findRunIdByWidgetToken, getWidgetConfig, isWidgetTokenValid, subscribeToRun } from "@/features/run";
import { getTeamByRunId } from "@/features/team";
import { WIDGET_CONTRACT_VERSION, type WidgetEvent, type WidgetState } from "../types";

/** Read model del widget: compone config (run) + equipo (team) en el contrato público. */
export async function getWidgetState(runId: string): Promise<WidgetState | null> {
  const [config, team] = await Promise.all([getWidgetConfig(runId), getTeamByRunId(runId)]);
  if (!config) return null;
  return {
    v: WIDGET_CONTRACT_VERSION,
    config,
    slots: team
      .filter((s) => s.species)
      .map((s) => ({
        position: s.position,
        speciesName: s.speciesName,
        spriteId: s.spriteId,
        nickname: s.nickname,
        level: s.level,
        types: s.types,
        shiny: s.shiny,
        fainted: s.fainted,
      })),
  };
}

export async function getWidgetStateByToken(token: string): Promise<WidgetState | null> {
  const runId = await findRunIdByWidgetToken(token);
  return runId ? getWidgetState(runId) : null;
}

const PING_MS = 25_000;

/**
 * Stream SSE: envía el estado al conectar y en cada cambio de la run.
 * Si el token se regenera, envía "revoked" y cierra.
 */
export async function createWidgetStream(token: string, signal: AbortSignal): Promise<Response | null> {
  const runId = await findRunIdByWidgetToken(token);
  if (!runId) return null;

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const write = (chunk: string) => !closed && controller.enqueue(encoder.encode(chunk));
      const send = (e: WidgetEvent) => write(`event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`);
      const close = () => {
        if (closed) return;
        closed = true;
        cleanup();
        try {
          controller.close();
        } catch {}
      };

      const push = async () => {
        if (!(await isWidgetTokenValid(runId, token))) {
          send({ event: "revoked", data: {} });
          return close();
        }
        const state = await getWidgetState(runId);
        if (state) send({ event: "state", data: state });
      };

      const unsubscribe = subscribeToRun(runId, () => void push().catch(close));
      const ping = setInterval(() => write(": ping\n\n"), PING_MS); // evita que OBS/proxies corten
      cleanup = () => {
        unsubscribe();
        clearInterval(ping);
      };
      signal.addEventListener("abort", close);

      write("retry: 2000\n\n");
      await push();
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
      "X-Accel-Buffering": "no",
    },
  });
}
