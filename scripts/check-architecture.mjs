// Prueba de arquitectura (fitness function). Falla si:
//  1. una feature importa otra que no está en su lista permitida (evita ciclos y acoplamiento)
//  2. un archivo de servidor no empieza con `import "server-only"`
// Uso: npm run lint:arch
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/** Grafo de dependencias permitido entre features (dirigido y sin ciclos). */
const ALLOWED = {
  auth: [],
  run: ["auth"],
  team: ["run"],
  showdown: ["auth", "team"],
  widget: ["run", "team"],
  dashboard: ["auth", "run", "team", "showdown", "widget"],
  legal: [],
};

/** Archivos que deben declarar `import "server-only"`. */
const SERVER_ONLY = [
  /^src\/core\/(config|db|realtime)\/.*\.ts$/,
  /^src\/core\/pokedex\/(server|showdown)\.ts$/,
  /^src\/core\/action\.ts$/,
  /^src\/features\/[^/]+\/server\/(?!.*\.test\.ts$).*\.ts$/,
  /^src\/features\/[^/]+\/index\.ts$/,
];

const root = path.resolve(import.meta.dirname, "..");
const files = []; // sin src/generated
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(name) && !full.includes(`${path.sep}generated${path.sep}`)) files.push(path.relative(root, full).split(path.sep).join("/"));
  }
})(path.join(root, "src"));

const errors = [];
for (const file of files) {
  if (file.startsWith("src/generated/") || file.endsWith(".test.ts")) continue;
  const code = readFileSync(path.join(root, file), "utf8");

  const own = file.match(/^src\/features\/([^/]+)\//)?.[1];
  if (own) {
    if (!(own in ALLOWED)) errors.push(`${file}: la feature "${own}" no está declarada en ALLOWED (scripts/check-architecture.mjs)`);
    for (const [, dep] of code.matchAll(/from\s+["']@\/features\/([^/"']+)/g)) {
      if (dep !== own && !ALLOWED[own]?.includes(dep)) errors.push(`${file}: "${own}" no puede depender de "${dep}"`);
    }
  }

  if (SERVER_ONLY.some((re) => re.test(file)) && !/^import "server-only";/m.test(code)) {
    errors.push(`${file}: falta \`import "server-only";\``);
  }
}

if (errors.length) {
  console.error(`✖ Arquitectura: ${errors.length} problema(s)\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
console.log(`✓ Arquitectura OK (${files.length} archivos)`);
