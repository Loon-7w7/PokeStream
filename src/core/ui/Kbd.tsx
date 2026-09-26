export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-line bg-card px-1.5 py-px font-mono text-[10px] text-text">{children}</kbd>;
}
