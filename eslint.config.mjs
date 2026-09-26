import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/*
 * Reglas de arquitectura (ver docs/ARCHITECTURE.md). ESLint las hace cumplir:
 * un import que rompa la arquitectura falla en `npm run lint` y en CI.
 * Nota: en flat config, el último bloque que coincide con un archivo gana,
 * por eso cada bloque repite la lista completa de restricciones que le aplica.
 */
const R = {
  pkmn: { group: ["@pkmn/*"], message: "Solo core/pokedex usa @pkmn (capa anticorrupción)." },
  db: {
    group: ["@/core/db/*", "@/generated/*", "@prisma/*"],
    message: "Solo los *.repository.ts y la unidad de trabajo acceden a la BD.",
  },
  deepFeature: {
    group: ["@/features/*/*", "!@/features/*/actions", "!@/features/*/ui", "!@/features/*/types"],
    message: "Usa la API pública de la feature: @/features/x (servidor), /actions, /ui o /types. Dentro de la misma feature usa rutas relativas.",
  },
  coreUp: { group: ["@/features/*", "@/features/**", "@/app/*", "@/app/**"], message: "core/ no depende de features/ ni de app/." },
  domainPure: {
    group: ["next", "next/*", "react", "react-dom", "@/core/db/*", "@/core/realtime/*", "@/core/config/*", "@/core/action", "../server/*", "../actions", "../ui/*", "@/features/*"],
    message: "El dominio es puro: sin Next, React, BD, entorno ni otras features.",
  },
};
const restrict = (...patterns) => ({ "no-restricted-imports": ["error", { patterns }] });

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/generated/**"]),

  // Por defecto (app/, features/)
  { files: ["src/**/*.{ts,tsx}"], rules: restrict(R.pkmn, R.db, R.deepFeature) },
  // core/
  { files: ["src/core/**/*.{ts,tsx}"], rules: restrict(R.pkmn, R.db, R.coreUp) },
  { files: ["src/core/pokedex/**/*.{ts,tsx}"], rules: restrict(R.db, R.coreUp) },
  { files: ["src/core/db/**/*.ts"], rules: restrict(R.pkmn, R.coreUp) },
  // Acceso a datos
  { files: ["src/features/*/server/*.repository.ts", "src/features/run/server/unit-of-work.ts"], rules: restrict(R.pkmn, R.deepFeature) },
  // Dominio puro
  { files: ["src/features/*/domain/**/*.ts"], rules: restrict(R.pkmn, R.db, R.deepFeature, R.domainPure) },
  // Tests: pueden entrar a cualquier capa
  { files: ["src/**/*.test.ts", "test/**/*.ts"], rules: { "no-restricted-imports": "off" } },
  // Variables sin usar con prefijo _ permitidas (desestructuración para omitir campos)
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
]);

export default eslintConfig;
