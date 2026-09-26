import { TYPE_COLORS, TYPE_ES } from "./pokemon";
import { cx } from "./cx";

export function TypeBadge({ type, className }: { type: string; className?: string }) {
  return (
    <span
      className={cx("rounded px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-white", className)}
      style={{ background: TYPE_COLORS[type] ?? "#555" }}
    >
      {TYPE_ES[type] ?? type}
    </span>
  );
}
