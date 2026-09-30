// Pie del panel: créditos, privacidad y donación. Fijo abajo: siempre visible aunque haya scroll.
import { Coffee } from "lucide-react";
import Link from "next/link";

export function Footer({ kofiUrl }: { kofiUrl: string }) {
  return (
    <footer className="sticky bottom-0 z-30 border-t border-line bg-panel/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm text-muted">
        <span>
          Producciones <span className="font-semibold text-text">Alpeka</span> / <span className="font-semibold text-text">LonyArts</span>
          {" · "}
          <Link href="/privacidad" className="underline-offset-2 hover:text-text hover:underline">
            Privacidad
          </Link>
        </span>
        {kofiUrl && (
          <a
            href={kofiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#FF5E5B] px-4 py-1.5 font-semibold text-white shadow-sm transition hover:brightness-110"
          >
            <Coffee className="size-5" />
            Apóyame en Ko-fi
          </a>
        )}
      </div>
    </footer>
  );
}
