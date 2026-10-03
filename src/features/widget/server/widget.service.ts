import "server-only";
import { findRunIdByWidgetToken, getWidgetRun, subscribeToRun } from "@/features/run";
import type { WidgetRun } from "@/features/run/types";
import { getTeamWithDeaths } from "@/features/team";
import type { SlotView } from "@/features/team/types";
import { WIDGET_CONTRACT_VERSION, type StreamClient, type WidgetEvent, type WidgetState } from "../types";

/** Read model del widget: compone config (run) + equipo y muertes (team) en el contrato público. */
export async function getWidgetState(runId: string): Promise<WidgetState | null> {
  // Run, slots y Muertos en paralelo: una sola tanda de consultas
  const [run, team] = await Promise.all([getWidgetRun(runId), getTeamWithDeaths(runId)]);
  return run && toWidgetState(run, team);
}

function toWidgetState({ config, nuzlocke }: WidgetRun, { team, deaths }: { team: SlotView[]; deaths: number }): WidgetState {
  return {
    v: WIDGET_CONTRACT_VERSION,
    config,
    deaths: nuzlocke && config.deathCounter ? deaths : null,
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
/** Si falla la lectura tras un cambio, se reintenta: si no, el widget se quedaría con el estado viejo. */
const RETRY_MS = 5_000;
/** Conexiones SSE abiertas por run (OBS + pestañas del panel). Más allá se responde 429. */
const MAX_STREAMS_PER_RUN = 20;

type Listener = { token: string; client: StreamClient; send: (e: WidgetEvent) => void; close: () => void };

/**
 * Un "hub" por run: ante un cambio lee el estado UNA vez y lo reparte a todas las conexiones,
 * en lugar de consultar la BD por cada una. Si llegan cambios mientras lee, repite una sola vez.
 * Las pestañas del panel solo reciben `changed` (no usan el estado; se refrescan con su propio render).
 */
class RunHub {
  readonly listeners = new Set<Listener>();
  /** Momento (ms) del último cambio publicado; el panel lo compara con el de su último render. */
  lastChangeAt = 0;
  private unsubscribe: (() => void) | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private pending = false;

  constructor(private readonly runId: string) {}

  add(l: Listener) {
    this.listeners.add(l);
    this.unsubscribe ??= subscribeToRun(this.runId, () => {
      this.lastChangeAt = Date.now();
      void this.broadcast();
    });
  }

  remove(l: Listener) {
    this.listeners.delete(l);
    if (this.listeners.size) return;
    this.unsubscribe?.();
    this.unsubscribe = null;
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    hubs.delete(this.runId);
  }

  private async broadcast() {
    if (this.running) return void (this.pending = true);
    this.running = true;
    const at = this.lastChangeAt;
    try {
      // Con solo pestañas del panel no hace falta leer el equipo: basta con el acceso
      const needsState = [...this.listeners].some((l) => l.client !== "panel");
      const [run, team] = await Promise.all([getWidgetRun(this.runId, { withAccess: true }), needsState ? getTeamWithDeaths(this.runId) : null]);
      const access = run?.access;
      const state = run && team && toWidgetState(run, team);
      for (const l of [...this.listeners]) {
        if (l.token !== access?.token || access.blocked) {
          // Token regenerado o dueño bloqueado: esta conexión ya no tiene acceso
          l.send({ event: access?.blocked && l.token === access.token ? "blocked" : "revoked", data: {} });
          l.close();
        } else if (l.client === "panel") l.send({ event: "changed", data: { at } });
        else if (state) l.send({ event: "state", data: state });
      }
    } catch (e) {
      console.error("[widget] Falló el envío del estado", e);
      this.retry ??= setTimeout(() => {
        this.retry = null;
        void this.broadcast();
      }, RETRY_MS);
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

/** Widgets de OBS conectados ahora mismo, por run (sin contar pestañas del panel). */
export function countObsConnections(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const [runId, hub] of hubs) {
    const n = [...hub.listeners].filter((l) => l.client === "obs").length;
    if (n) counts.set(runId, n);
  }
  return counts;
}

/**
 * Stream SSE: envía el estado al conectar y en cada cambio de la run.
 * Si el token se regenera, envía "revoked" y cierra.
 */
export async function createWidgetStream(token: string, signal: AbortSignal, client: StreamClient = "obs"): Promise<Response | null> {
  const runId = await findRunIdByWidgetToken(token);
  if (!runId) return null;
  if ((hubs.get(runId)?.listeners.size ?? 0) >= MAX_STREAMS_PER_RUN) {
    return new Response("Demasiadas conexiones abiertas", { status: 429, headers: { "Retry-After": "30" } });
  }
  // El panel ya trae el estado en su render: solo necesita saber si hubo cambios desde entonces
  const initial = client === "panel" ? null : await getWidgetState(runId);

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
      const listener: Listener = { token, client, send, close };
      hub.add(listener);
      const ping = setInterval(() => write(": ping\n\n"), PING_MS); // evita que OBS/proxies corten
      cleanup = () => {
        hub.remove(listener);
        clearInterval(ping);
      };
      signal.addEventListener("abort", close);

      write("retry: 2000\n\n");
      if (client === "panel") send({ event: "changed", data: { at: hub.lastChangeAt } });
      else if (initial) send({ event: "state", data: initial });
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
