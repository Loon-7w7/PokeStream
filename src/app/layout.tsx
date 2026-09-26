import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: process.env.APP_NAME || "PartyHUD",
  description: "Panel y widget de OBS para mostrar tu equipo Pokémon en directo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
