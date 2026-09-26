import "server-only";
import { EventEmitter } from "node:events";

/**
 * Puerto de tiempo real. Hoy: memoria (una instancia). Para escalar a varias
 * instancias, implementar esta misma interfaz con Redis pub/sub y cambiar `bus`.
 */
export interface RealtimeBus {
  publish(channel: string): void;
  subscribe(channel: string, onMessage: () => void): () => void;
}

class MemoryBus implements RealtimeBus {
  private emitter = new EventEmitter().setMaxListeners(0);
  publish(channel: string) {
    this.emitter.emit(channel);
  }
  subscribe(channel: string, onMessage: () => void) {
    this.emitter.on(channel, onMessage);
    return () => void this.emitter.off(channel, onMessage);
  }
}

const g = globalThis as unknown as { realtimeBus?: RealtimeBus };
export const bus: RealtimeBus = (g.realtimeBus ??= new MemoryBus());

/** Canales conocidos (evita strings sueltos). */
export const channels = {
  run: (runId: string) => `run:${runId}`,
};
