// Pie del panel: créditos y donación.
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
          <CoffeeIcon />
          Apóyame en Ko-fi
        </a>
      </div>
    </footer>
  );
}

function CoffeeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
      <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M10.5 11.2c-.9-.9-2.4-.2-2.1 1 .3 1.1 2.1 2.3 2.1 2.3s1.8-1.2 2.1-2.3c.3-1.2-1.2-1.9-2.1-1Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
