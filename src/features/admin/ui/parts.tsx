"use client";
// Piezas compartidas de las tablas de /admin.
import { cx } from "@/core/ui/cx";

export function IconButton(props: { label: string; Icon: React.ComponentType<{ className?: string }>; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  const { Icon } = props;
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.label}
      aria-label={props.label}
      className={cx(
        "rounded-md border border-line p-1.5 text-muted disabled:opacity-50",
        props.danger ? "hover:border-bad hover:text-bad" : "hover:border-accent hover:text-accent",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

/** Fecha en la zona horaria del navegador (el servidor puede estar en otra: se ignora el desajuste). */
export function LocalDate({ iso, withTime = false }: { iso: string | null; withTime?: boolean }) {
  if (!iso) return <span>—</span>;
  const text = new Date(iso).toLocaleString("es", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}
