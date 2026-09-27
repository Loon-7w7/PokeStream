// Pie del panel: créditos y donación.
import { Coffee } from "lucide-react";

const KOFI_URL = "https://ko-fi.com/lonyarts";

export function Footer() {
  return (
    <footer className="border-t border-line bg-panel">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-muted">
        <span>
          Producciones <span className="font-semibold text-text">Alpeka</span> / <span className="font-semibold text-text">LonyArts</span>
        </span>
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#FF5E5B] px-4 py-2 font-semibold text-white shadow-sm transition hover:brightness-110"
        >
          <Coffee className="size-5" />
          Apóyame en Ko-fi
        </a>
      </div>
    </footer>
  );
}
