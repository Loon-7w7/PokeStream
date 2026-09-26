import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autocontenido para Docker (.next/standalone)
  output: "standalone",
  // Driver de SQLite (libsql): binarios nativos precompilados por plataforma, no se empaquetan
  serverExternalPackages: ["@libsql/client", "libsql"],
  // El trazado automático no detecta el binario que libsql carga según la plataforma
  outputFileTracingIncludes: {
    "/**": ["./node_modules/@libsql/linux-x64-gnu/**", "./node_modules/@libsql/linux-arm64-gnu/**", "./node_modules/@libsql/win32-x64-msvc/**"],
  },
};

export default nextConfig;
