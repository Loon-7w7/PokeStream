"use client";
// /beta: formulario público de preregistro. Sin login; aprobar la postulación (en /admin) invita el correo.
import { CircleAlert, CircleCheck, Coffee, Send } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { cx } from "@/core/ui/cx";
import { Logo } from "@/core/ui/Logo";
import { submitApplication } from "../actions";
import type { Platform } from "../types";

const PLATFORMS: { value: Platform; label: string; placeholder: string }[] = [
  { value: "twitch", label: "Twitch", placeholder: "tu_usuario o twitch.tv/tu_usuario" },
  { value: "kick", label: "Kick", placeholder: "tu_usuario o kick.com/tu_usuario" },
  { value: "youtube", label: "YouTube", placeholder: "@tu_canal o youtube.com/@tu_canal" },
  { value: "other", label: "Otra", placeholder: "https://… (enlace a tu canal)" },
];

const MESSAGE_MAX = 500;

const input = "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-accent";

export function BetaSignupForm({ appName, kofiUrl }: { appName: string; kofiUrl: string }) {
  const [platform, setPlatform] = useState<Platform>("twitch");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const field = (name: string) => String(form.get(name) ?? "").trim();
    setError(null);
    startTransition(async () => {
      try {
        const res = await submitApplication({
          email: field("email"),
          name: field("name"),
          platform,
          channel: field("channel"),
          message: field("message"),
          website: field("website"),
        });
        if (res.ok) setSent(true);
        else setError(res.error);
      } catch {
        setError("No se pudo contactar con el servidor.");
      }
    });
  };

  return (
    <main className="min-h-svh bg-bg px-4 py-10 text-text">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex items-center gap-3">
          <Logo size={44} />
          <div>
            <h1 className="text-2xl font-black tracking-tight">{appName}</h1>
            <p className="text-sm text-muted">Beta cerrada · preregistro</p>
          </div>
        </div>

        {sent ? (
          <section role="status" className="mt-8 rounded-2xl border border-line bg-panel p-6 text-center">
            <CircleCheck className="mx-auto size-10 text-ok" />
            <h2 className="mt-3 text-xl font-bold">¡Listo, ya estás en la lista!</h2>
            <p className="mt-2 text-sm text-muted">
              Revisamos las postulaciones a mano. Cuando te aprobemos podrás entrar con la cuenta de Google del correo que
              nos diste. Si vuelves a enviar el formulario con el mismo correo, actualizamos tus datos.
            </p>
            <Link href="/login" className="mt-5 inline-block text-sm text-accent underline-offset-2 hover:underline">
              Ir a iniciar sesión
            </Link>
          </section>
        ) : (
          <form onSubmit={submit} className="relative mt-8 grid gap-5 rounded-2xl border border-line bg-panel p-5 sm:p-6">
            <p className="text-sm text-muted">
              Muestra tu equipo Pokémon en directo con un widget para OBS. Estamos abriendo la beta poco a poco: déjanos tus
              datos y te avisamos cuando tengas acceso.
            </p>

            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold">
                Correo de Google <span className="text-bad">*</span>
              </span>
              <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="tu_correo@gmail.com" className={input} />
              <span className="text-xs text-muted">El de la cuenta con la que entrarás: es el que vamos a autorizar.</span>
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold">Nombre o apodo</span>
              <input name="name" maxLength={60} autoComplete="nickname" placeholder="¿Cómo te llamamos?" className={input} />
            </label>

            <fieldset className="grid gap-1.5 text-sm">
              <legend className="mb-1.5 font-semibold">
                Plataforma de streaming <span className="text-bad">*</span>
              </legend>
              <div role="radiogroup" aria-label="Plataforma" className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-bg p-1 sm:grid-cols-4">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    role="radio"
                    aria-checked={platform === p.value}
                    onClick={() => setPlatform(p.value)}
                    className={cx("rounded-md py-1.5", platform === p.value ? "bg-accent font-semibold text-bg" : "text-muted hover:text-text")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold">
                Canal <span className="text-bad">*</span>
              </span>
              <input
                name="channel"
                required
                maxLength={200}
                placeholder={PLATFORMS.find((p) => p.value === platform)?.placeholder}
                className={input}
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold">¿Por qué quieres probarlo?</span>
              <textarea
                name="message"
                rows={3}
                maxLength={MESSAGE_MAX}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Qué juegas, cada cuánto haces directo, cómo nos conociste…"
                className={cx(input, "resize-y")}
              />
              <span className="text-right text-xs text-muted">
                {message.length}/{MESSAGE_MAX}
              </span>
            </label>

            {/* Campo trampa: oculto para personas y lectores de pantalla; los bots lo rellenan. */}
            <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
              <label>
                Web
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <label className="flex items-start gap-2 text-sm text-muted">
              <input type="checkbox" required className="mt-1 accent-[var(--color-accent)]" />
              <span>
                Acepto que se guarden estos datos para gestionar mi acceso a la beta, según la{" "}
                <Link href="/privacidad" target="_blank" className="text-accent underline-offset-2 hover:underline">
                  política de privacidad
                </Link>
                .
              </span>
            </label>

            {error && (
              <p role="alert" className="flex items-start gap-2 text-sm text-bad">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}

            <button
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent py-3 font-semibold text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Send className="size-4" />
              {pending ? "Enviando…" : "Apuntarme a la beta"}
            </button>
          </form>
        )}

        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted">
          <span>Gratis para cualquier streamer.</span>
          <Link href="/privacidad" className="underline-offset-2 hover:text-text hover:underline">
            Privacidad
          </Link>
          {kofiUrl && (
            <a href={kofiUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-text">
              <Coffee className="size-3.5" />
              Apoya el proyecto en Ko-fi
            </a>
          )}
        </p>
      </div>
    </main>
  );
}
