import type { Metadata } from "next";
import { env } from "@/core/config/env";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  return { title: env.APP_NAME, description: "Panel y widget de OBS para mostrar tu equipo Pokémon en directo" };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
