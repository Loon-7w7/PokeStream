"use client";
import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import type { ActionResult } from "../result";

/**
 * Ejecutor de server actions para el cliente.
 * - Corre la acción en una transición (la UI no se bloquea y `pending` se muestra).
 * - `optimistic` se ejecuta dentro de la transición: úsalo con useOptimistic.
 * - Si la acción devuelve { ok: false }, muestra el error en el banner global.
 */
type Runner = <T>(action: () => Promise<ActionResult<T>>, optimistic?: () => void) => Promise<ActionResult<T> | null>;

const Ctx = createContext<{ run: Runner; pending: boolean; error: string | null; clearError: () => void } | null>(null);

export function ActionProvider({ children }: { children: React.ReactNode }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run: Runner = useCallback(
    (action, optimistic) =>
      new Promise((resolve) => {
        setError(null);
        startTransition(async () => {
          optimistic?.();
          try {
            const res = await action();
            if (!res.ok) setError(res.error);
            resolve(res);
          } catch {
            setError("No se pudo contactar con el servidor.");
            resolve(null);
          }
        });
      }),
    [],
  );

  const value = useMemo(() => ({ run, pending, error, clearError: () => setError(null) }), [run, pending, error]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAction() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAction debe usarse dentro de <ActionProvider>");
  return ctx;
}
