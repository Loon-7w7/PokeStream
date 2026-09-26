"use client";
// Descarga el índice de la Pokédex una sola vez por pestaña.
import { useEffect, useState } from "react";
import type { DexIndex } from "./types";

let promise: Promise<DexIndex> | null = null;
let cached: DexIndex | null = null;

export function loadDex(): Promise<DexIndex> {
  promise ??= fetch("/api/dex")
    .then((r) => r.json() as Promise<DexIndex>)
    .then((d) => (cached = d));
  return promise;
}

export function useDex(): DexIndex | null {
  const [dex, setDex] = useState<DexIndex | null>(cached);
  useEffect(() => {
    if (!dex) loadDex().then(setDex);
  }, [dex]);
  return dex;
}
