import { CircleAlert } from "lucide-react";
import { Logo } from "@/core/ui/Logo";
import { PokeballStage } from "@/core/ui/PokeballStage";
import type { LoginError } from "../types";

const MESSAGES: Record<LoginError, string> = {
  invalid_state: "El inicio de sesión caducó. Vuelve a entrar con Google.",
  not_allowed: "Esa cuenta de Google no tiene acceso. Entra con una cuenta autorizada.",
  google_failed: "No se pudo conectar con Google. Revisa tu conexión y vuelve a intentarlo.",
};

export function LoginCard({ appName, error }: { appName: string; error?: string }) {
  const message = error && error in MESSAGES ? MESSAGES[error as LoginError] : null;
  return (
    <PokeballStage center={<Logo size={52} />}>
      <h1 className="text-4xl font-black tracking-tight">{appName}</h1>
      <p className="mt-2 text-sm text-muted">Inicia sesión para editar tu equipo y el widget.</p>

      {/* <a> normal y no <Link>: es una ruta API que redirige a Google */}
      <a
        href="/api/auth/google"
        className="mx-auto mt-7 flex w-full max-w-sm items-center justify-center gap-3 rounded-full bg-white py-3 font-semibold text-[#1f1f1f] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <GoogleIcon />
        Entrar con Google
      </a>

      {message && (
        <p role="alert" className="mt-4 flex items-start gap-2 text-left text-sm text-bad">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {message}
        </p>
      )}
    </PokeballStage>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}
