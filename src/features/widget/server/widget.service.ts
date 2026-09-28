import "server-only";
import { findRunIdByWidgetToken, getWidgetConfig, getWidgetToken, subscribeToRun } from "@/features/run";
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
/** Conexiones SSE abiertas por run (OBS + pestañas del panel). Más allá se responde 429. */
const MAX_STREAMS_PER_RUN = 20;

type Listener = { token: string; send: (e: WidgetEvent) => void; close: () => void };

/**
 * Un "hub" por run: ante un cambio lee el estado UNA vez y lo reparte a todas las conexiones,
 * en lugar de consultar la BD por cada una. Si llegan cambios mientras lee, repite una sola vez.
 */
class RunHub {
  readonly listeners = new Set<Listener>();
  private unsubscribe: (() => void) | null = null;
  private running = false;
  private pending = false;

  constructor(private readonly runId: string) {}

  add(l: Listener) {
    this.listeners.add(l);
    this.unsubscribe ??= subscribeToRun(this.runId, () => void this.broadcast());
  }

  remove(l: Listener) {
    this.listeners.delete(l);
    if (this.listeners.size) return;
    this.unsubscribe?.();
    this.unsubscribe = null;
    hubs.delete(this.runId);
  }

  private async broadcast() {
    if (this.running) return void (this.pending = true);
    this.running = true;
    try {
      const [token, state] = await Promise.all([getWidgetToken(this.runId), getWidgetState(this.runId)]);
      for (const l of [...this.listeners]) {
        if (l.token !== token) {
          // Token regenerado: esta conexión ya no tiene acceso
          l.send({ event: "revoked", data: {} });
          l.close();
        } else if (state) l.send({ event: "state", data: state });
      }
    } catch (e) {
      console.error("[widget] Falló el envío del estado", e);
    } finally {
      this.running = false;
      if (this.pending) {
        this.pending = false;
        void this.broadcast();
      }
    }
  }
}

const g = globalThis as unknown as { widgetHubs?: Map<string, RunHub> };
const hubs = (g.widgetHubs ??= new Map<string, RunHub>());

/**
 * Stream SSE: envía el estado al conectar y en cada cambio de la run.
 * Si el token se regenera, envía "revoked" y cierra.
 */
export async function createWidgetStream(token: string, signal: AbortSignal): Promise<Response | null> {
  const runId = await findRunIdByWidgetToken(token);
  if (!runId) return null;
  if ((hubs.get(runId)?.listeners.size ?? 0) >= MAX_STREAMS_PER_RUN) {
    return new Response("Demasiadas conexiones abiertas", { status: 429, headers: { "Retry-After": "30" } });
  }
  const initial = await getWidgetState(runId);

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
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

      const hub = hubs.get(runId) ?? new RunHub(runId);
      hubs.set(runId, hub);
      const listener: Listener = { token, send, close };
      hub.add(listener);
      const ping = setInterval(() => write(": ping\n\n"), PING_MS); // evita que OBS/proxies corten
      cleanup = () => {
        hub.remove(listener);
        clearInterval(ping);
      };
      signal.addEventListener("abort", close);

      write("retry: 2000\n\n");
      if (initial) send({ event: "state", data: initial });
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
