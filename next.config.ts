import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autocontenido para Docker (.next/standalone)
  output: "standalone",
  // Módulo nativo de SQLite: no se empaqueta, se carga desde node_modules
  serverExternalPackages: ["better-sqlite3"],
  // El trazado automático no detecta los binarios precompilados de better-sqlite3
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/better-sqlite3/lib/**",
      "./node_modules/better-sqlite3/prebuilds/linux-x64.node",
      "./node_modules/better-sqlite3/prebuilds/linux-arm64.node",
      "./node_modules/better-sqlite3/prebuilds/win32-x64.node",
    ],
  },
};

export default nextConfig;
