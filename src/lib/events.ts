// Bus de eventos en memoria para el tiempo real (SSE).
// Una sola instancia del servidor = basta con esto. Si algún día hay varias
// instancias, cambiar publish/subscribe por Redis pub/sub sin tocar el resto.
import { EventEmitter } from "node:events";

const g = globalThis as unknown as { runBus?: EventEmitter };
const bus = g.runBus ?? new EventEmitter();
bus.setMaxListeners(0);
g.runBus = bus;

/** Avisa a los suscriptores (widget, otras pestañas del panel) que la run cambió. */
export function publishRunChanged(runId: string) {
  bus.emit(`run:${runId}`);
}

export function subscribeRun(runId: string, fn: () => void): () => void {
  bus.on(`run:${runId}`, fn);
  return () => bus.off(`run:${runId}`, fn);
}
