import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // "server-only" lanza fuera de React Server Components; en tests es un no-op
      "server-only": path.resolve(import.meta.dirname, "test/stubs/empty.ts"),
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
