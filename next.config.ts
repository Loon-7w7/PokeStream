import type { NextConfig } from "next";

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
    ];
    return [
      {
        source: "/:path((?!widget/).*)",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          ...common,
        ],
      },
      {
        source: "/widget/:token",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
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
