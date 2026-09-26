"use client";
import { useEffect } from "react";

export function Modal(props: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && props.onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[8vh] backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && props.onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
        className={`w-full ${props.wide ? "max-w-3xl" : "max-w-xl"} rounded-2xl border border-line bg-panel p-5 text-text shadow-2xl`}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold">{props.title}</h3>
          <button onClick={props.onClose} className="rounded-md px-2 text-muted hover:text-text" aria-label="Cerrar">
            ✕
          </button>
        </div>
        {props.children}
      </div>
    </div>
  );
}
