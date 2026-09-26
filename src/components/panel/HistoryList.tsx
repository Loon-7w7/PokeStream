"use client";
import { useEffect, useState } from "react";
import type { HistoryItem } from "@/lib/types";

function ago(iso: string, now: number) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "ahora";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} d`;
}

export function HistoryList({ history }: { history: HistoryItem[] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <h2 className="mb-3 font-semibold">Historial</h2>
      {history.length === 0 ? (
        <p className="text-sm text-muted">Aún no hay cambios.</p>
      ) : (
        <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1 text-sm">
          {history.map((h) => (
            <li key={h.id} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span className="flex-1">{h.message}</span>
              <span suppressHydrationWarning className="shrink-0 text-xs text-muted">
                {ago(h.createdAt, now)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
