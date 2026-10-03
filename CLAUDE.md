# PartyHUD — contexto para Claude

Panel web + widget de OBS (SSE) que muestra el equipo Pokémon del streamer en vivo. Multiusuario (una run por cuenta de Google), gratis con donaciones por Ko-fi. Docker; BD remota prevista: Turso. Nombre provisional (`APP_NAME`).

## Cómo trabajar aquí (ahorra tokens)
- Lee solo los archivos que toque el cambio (usa el mapa de abajo). No explores `node_modules`, `src/generated` ni `.next`.
- `docs/ARCHITECTURE.md` tiene las reglas completas y el porqué: léelo solo si el cambio cruza features o añade una nueva.
- No leas `node_modules/next/dist/docs` salvo para una API de Next que no esté aquí.
- Al terminar: `npm run check` (tipos + lint con límites + prueba de arquitectura + tests). Si falla un límite, arregla el diseño, no silencies la regla.
- UI y mensajes en español. Datos Pokémon en inglés (formato Showdown). Identificadores en inglés.

## Stack
Next 16 (App Router, React 19, Turbopack) · Tailwind v4 · Prisma 7 + SQLite (adapter libsql: binarios precompilados, nunca node-gyp) · @pkmn/dex/@pkmn/sets · zod 4 · fuse.js · dnd-kit · react-joyride (tour) · recharts (gráficas de /admin) · vitest.
Next 16: `middleware` → `src/proxy.ts`; `params`/`cookies()` son async; `refresh()` de `next/cache` en server actions.

## Reglas que no se rompen
1. Capas: `app → features → core`. `core` no importa features. El dominio (`features/*/domain`) es puro.
2. Otra feature solo por su API pública: `@/features/x` (servidor) · `/actions` · `/ui` · `/types`. Dentro de la feature, rutas relativas.
3. Grafo permitido: `auth ← run ← team ← showdown`; `widget → run, team`; `admin → auth, run, widget`; `dashboard → todas` (menos admin); `tour` y `legal` sin dependencias. Cambiarlo = editar `ALLOWED` en `scripts/check-architecture.mjs`.
4. Solo `core/pokedex` importa `@pkmn/*`. Solo `*.repository.ts` y `unit-of-work.ts` importan `@/core/db`.
5. Todo archivo de servidor empieza con `import "server-only";`.
6. Toda escritura va por `mutateRun(({ db, runId, nuzlocke }) => …)`: auth + transacción + evento SSE. Repos reciben `db` como último parámetro.
7. Server action = `runAction(() => service(zodSchema.parse(input)), { refresh: true })`. Nunca lanza; errores esperados con `fail("CODE", "mensaje")`.
8. En BD van IDs (`heavydutyboots`), nunca nombres. `describeSet()` da los nombres.
9. El cliente no copia estado del servidor: props + `refresh()`; `useOptimistic` para respuesta instantánea.
10. `process.env` solo en `core/config/env.ts` (excepción: `proxy.ts`).

## Mapa
| Ruta | Qué hay |
|---|---|
| `prisma/schema.prisma` | `Run` (info + config del widget + token), `Slot` (6 por run, sin nivel: todo es nivel 50), `Storage` (caja y muertos como texto Showdown), `Session` (sesiones del panel) |
| `src/app/` | Rutas delgadas: `/` panel, `/login`, `/admin`, `/widget/[token]`, `/api/stream/[token]` (SSE), `/api/auth/google` (OAuth), `/api/dex` |
| `src/core/pokedex/server.ts` | `getSpeciesInfo`, `resolveId`, `describeSet`, `buildDexIndex` |
| `src/core/pokedex/showdown.ts` | `formatShowdown` / `parseShowdown` |
| `src/core/pokedex/sprites.ts` | URLs de sprites `{SPRITES_BASE_URL}{ani|gen5|dex}[-shiny]/{spriteId}` |
| `src/core/{action,result}.ts` | `runAction`, `ActionResult`, `DomainError`, `fail` |
| `src/core/ui/` | `ActionProvider`/`useAction`, `Modal`, `ConfirmDialog` (confirmar acciones importantes), `Sprite`, `TypeBadge`, `Logo`, `Kbd`, `cx`, colores de tipos |
| `features/auth` | Login con Google (`arctic`, `server/google.ts`), sesión: cookie firmada HMAC con id (`server/session.ts`) + tabla `Session` (`server/session.repository.ts`, logout la borra), acceso: `canEnter` (`domain/access.ts`: admin siempre, bloqueado nunca, si no registro abierto o invitado) + tablas `Access`/`AccessSettings` (`server/access.*`), `ADMIN_EMAILS` en .env, `requireAdmin`/`isCurrentUserAdmin`, `isEmailBlocked` (run corta el widget del bloqueado); `requireUser` (correo o `UNAUTHORIZED`), `isSignedIn`, `LOCAL_USER` sin login, `startGoogleLogin`/`finishGoogleLogin` (rutas `/api/auth/google[/callback]`), `logout`, `LoginCard` |
| `features/run` | `getCurrentRun` (único punto de identidad: sesión → run por `ownerEmail`; la run sin dueño la reclama `LEGACY_OWNER_EMAIL`), `mutateRun` (ctx incluye `nuzlocke`), info (`resetRunInfo`; el Nuzlocke no se desactiva salvo con Nueva partida), config del widget, `RunHeader` (acepta `actions` y `profile`) |
| `features/team/domain/slot.ts` | Reglas: `placeSpecies`, `evolve`, `applyPatch` (debilitado + regla Nuzlocke), `destinationOf` (caja o muertos), `validateOrder`; `storage.ts`: `stash`, `takeFromBox` |
| `features/team/server/` | `team.service.ts` (casos de uso), `slot.repository.ts`, `storage.repository.ts` |
| `features/team/ui/` | `TeamSection` (atajos 1-6/R/E/F, dnd, optimista), `SlotCard`, `SpeciesPicker`, `EditSlotDialog`, `StoragePanel` (pestañas Caja/Muertos), `NewGameButton` (`startNewGame`) |
| `features/showdown` | Exportar el equipo · importar a la caja (`addSetsToBox`); `ShowdownBox` (botones + diálogo de importar), `CopySlotButton` |
| `features/widget` | Contrato `WidgetState` (v4), stream SSE, `Widget` (OBS; layouts fila/libre), `WidgetSettings` (panel), `PositionEditor` (arrastrar slots y contador, posiciones en `Run.slotPositions`/`deathCounterPosition`), contador de muertes (`deaths`: solo en Nuzlocke, `countDeaths` en `team/domain/storage.ts`) |
| `features/legal` | `PrivacyPolicy` (ruta pública `/privacidad`) |
| `features/admin` | `/admin` (solo admins, si no 404): modo de registro, invitar, bloquear (corta panel y widget en vivo), cerrar sesiones, usuarios y estadísticas (`buildAdminUsers` en `domain/users.ts`); gráficas con Recharts (`AdminCharts`): embudo, registros por semana, top Pokémon y Nuzlocke/muertes (agregados en `domain/charts.ts`) |
| `features/tour` | Tour guiado con React Joyride (`useGuidedTour` → `{ start, Tour }`, pasos en `ui/steps.tsx` → apuntan a `data-tour="…"`) |
| `features/dashboard` | Composición del panel (`getDashboardState`, `Dashboard`, sincronización entre pestañas, panel lateral plegable, `ProfileMenu`: cuenta, admin, tour y salir) |
| `test/db.ts` | SQLite temporal con migraciones para tests de integración |

## Recetas
- **Regla de juego**: `team/domain/slot.ts` + caso en `slot.test.ts`.
- **Campo de slot**: migración → `SlotData` (`team/types.ts`) → `toSlot`/`toRow` en `slot.repository.ts` → `SlotEdit` en `team/actions.ts` → UI.
- **Opción del widget**: migración → `WidgetConfig` + `toWidgetConfig` (run) → `WidgetConfigInput` en `run/actions.ts` → `WidgetSettings` → `Widget`.
- **Feature nueva**: carpeta con `index.ts`/`actions.ts`/`types.ts`/`ui/`; declarar dependencias en `ALLOWED`.

## Comandos
`npm run dev` · `npm run check` · `npm test` · `npm run db:migrate -- --name x` · `docker compose up -d --build` · prueba pública desde Windows: `scripts/laptop.ps1` (`docs/DEPLOY-LAPTOP.md`)

## Pendiente
Layouts torre/burbujas · vista pública para el chat · comandos `!equipo` Twitch/Kick · borrar cuenta desde el panel · CSP con nonce (hoy `'unsafe-inline'`) · bus y límite de peticiones (`core/rate-limit.ts`, en `mutateRun`) con Redis si hay varias instancias · nombres en español.
