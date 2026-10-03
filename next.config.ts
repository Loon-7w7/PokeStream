import type { NextConfig } from "next";

// CSP sin nonce: Next mete scripts inline, así que 'unsafe-inline' sigue; lo que gana es cortar
// scripts, conexiones, formularios e iframes de otros orígenes. 'unsafe-eval' solo en desarrollo (React).
// Sprites: cualquier https (SPRITES_BASE_URL se configura en tiempo de ejecución).
const csp = (frameAncestors: string) =>
  [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-src 'self'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors}`,
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");

const nextConfig: NextConfig = {
  // Build autocontenido para Docker (.next/standalone)
  output: "standalone",
  poweredByHeader: false,
  // Cabeceras de seguridad. Nada se puede incrustar en iframes ajenos; el widget solo en el propio
  // sitio (vista previa del panel). OBS lo abre como página, así que no le afecta.
  // no-referrer: la URL del widget lleva el token y no debe viajar a los servidores de sprites.
  async headers() {
    const common = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      // El navegador la ignora por http (local); con https (túnel/dominio) fuerza https un año.
      // Sin includeSubDomains: no afecta a otros subdominios del dominio del usuario.
      { key: "Strict-Transport-Security", value: "max-age=31536000" },
    ];
    return [
      {
        source: "/:path((?!widget/).*)",
        headers: [
          { key: "Content-Security-Policy", value: csp("'none'") },
          { key: "X-Frame-Options", value: "DENY" },
          ...common,
        ],
      },
      {
        source: "/widget/:token",
        headers: [
          { key: "Content-Security-Policy", value: csp("'self'") },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          ...common,
        ],
      },
    ];
  },
  // Driver de SQLite (libsql): binarios nativos precompilados por plataforma, no se empaquetan
  serverExternalPackages: ["@libsql/client", "libsql"],
  // El trazado automático no detecta el binario que libsql carga según la plataforma
  outputFileTracingIncludes: {
    "/**": ["./node_modules/@libsql/linux-x64-gnu/**", "./node_modules/@libsql/linux-arm64-gnu/**", "./node_modules/@libsql/win32-x64-msvc/**"],
  },
};

export default nextConfig;
