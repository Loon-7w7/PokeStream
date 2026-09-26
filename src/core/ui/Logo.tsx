import { cx } from "./cx";

/** Icono de la app (public/logo.svg). El favicon sale de src/app/icon.svg. */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.svg" width={size} height={size} alt="" aria-hidden className={cx("shrink-0", className)} />;
}
