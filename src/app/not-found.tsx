// 404 de toda la app (URLs inexistentes y notFound(), p. ej. un token de widget inválido).
import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/core/config/env";
import { PokeballStage } from "@/core/ui/PokeballStage";
import { Sprite } from "@/core/ui/Sprite";

export const metadata: Metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <PokeballStage center={<Sprite base={env.SPRITES_BASE_URL} spriteId="psyduck" animated alt="Psyduck confundido" className="size-16" />}>
      <h1 className="text-4xl font-black tracking-tight">Esta página no existe</h1>
      <p className="mt-2 text-sm text-muted">Psyduck la buscó por todas partes. Revisa la dirección o vuelve al panel.</p>
      <Link
        href="/"
        className="mt-7 inline-flex items-center justify-center rounded-full bg-accent px-8 py-3 font-semibold text-bg transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        Volver al panel
      </Link>
    </PokeballStage>
  );
}
