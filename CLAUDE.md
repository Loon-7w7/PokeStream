# PartyHUD — contexto para Claude

Panel web + widget de OBS que muestra el equipo Pokémon del streamer en vivo. Un solo usuario (por ahora), corre en Docker en Windows. Nombre provisional: se cambia con `APP_NAME` en `.env`.

## Reglas de trabajo (ahorrar tokens)
- Lee SOLO los archivos del mapa que toque tu cambio. No explores `node_modules` ni `src/generated`.
- No leas `node_modules/next/dist/docs` salvo que uses una API de Next que no esté resumida abajo.
- Cambios pequeños y localizados. Mantén el estilo existente (Tailwind, sin librerías de UI).
- Tras cambiar código: `npm run typecheck && npm run lint && npm test`.
- UI y mensajes en español. Nombres de Pokémon/movimientos/objetos en inglés (formato Showdown).

## Stack
Next.js 16 (App Router, React 19) · Tailwind v4 · Prisma 7 + SQLite (adapter better-sqlite3) · @pkmn/dex y @pkmn/sets · fuse.js · dnd-kit · zod · vitest.

## Next 16: lo que cambia respecto a versiones viejas
- `middleware.ts` ahora es `src/proxy.ts` (export `proxy`).
- `params`, `cookies()`, `headers()` son async (`await`).
- Route handlers no se cachean por defecto; `export const dynamic = "force-static"` para cachear.
- Turbopack es el bundler por defecto en dev y build.

## Flujo de datos
1. El panel (`/`) llama server actions (`src/app/actions.ts`).
2. Cada acción: `requireAdmin()` → escribe en BD → `addHistory()` → `publishRunChanged()` → devuelve `RunState`.
3. `publishRunChanged` emite en un EventEmitter en memoria (`src/lib/events.ts`).
4. `/api/stream/[token]` (SSE) escucha y envía `WidgetState` completo al widget. El panel también escucha para sincronizar otras pestañas.
5. El widget (`/widget/[token]`) solo renderiza lo que recibe. No tiene lógica.

## Mapa de archivos
| Archivo | Qué hace |
|---|---|
| `prisma/schema.prisma` | Modelos `Run` (config del widget incluida), `Slot` (6 por run), `HistoryEntry` |
| `src/app/actions.ts` | TODAS las mutaciones (reemplazar, evolucionar, editar, PS, reordenar, config, importar/exportar Showdown, login) |
| `src/lib/run.ts` | Leer run activa, mapear fila BD ↔ `SlotData`, `getRunState`, `getWidgetState`, historial |
| `src/lib/dex.ts` | @pkmn/dex (solo servidor): especies válidas, PS, IDs, `toSlotView`, índice `/api/dex` |
| `src/lib/showdown.ts` | Exportar/importar texto de Showdown |
| `src/lib/sprites.ts` | URLs de sprites: `{SPRITES_BASE_URL}{ani|gen5|dex}[-shiny]/{spriteId}.{gif|png}` + respaldo |
| `src/lib/types.ts` | Tipos compartidos (`SlotData`, `SlotView`, `RunState`, `WidgetState`, `DexIndex`) |
| `src/lib/events.ts` | Bus en memoria (cambiar a Redis pub/sub si hay varias instancias) |
| `src/lib/auth.ts` + `src/proxy.ts` | Login de un usuario con cookie = `ADMIN_TOKEN` (vacío = sin login) |
| `src/lib/ui.ts` | Colores/nombres de tipos en español, color de barra de PS, `cx()` |
| `src/lib/useDex.ts` | Hook cliente: descarga `/api/dex` una vez |
| `src/components/panel/Panel.tsx` | Estado del panel, atajos de teclado (1-6, R, E, F), diálogos |
| `src/components/panel/SlotCard.tsx` | Tarjeta de slot: PS, evolucionar, debilitado, menú (copiar Showdown, shiny, quitar) |
| `src/components/panel/SpeciesPicker.tsx` | Buscador del reemplazo rápido (Fuse, Enter elige) |
| `src/components/panel/EditSlotDialog.tsx` | Formulario completo del slot (EVs/IVs opcionales) |
| `src/components/panel/WidgetSettings.tsx` | URL para OBS, vista previa (iframe), sliders y toggles |
| `src/components/panel/ShowdownBox.tsx` | Exportar (copiar/descargar) e importar equipo |
| `src/components/widget/Widget.tsx` | Widget OBS: conexión SSE + layout `HudBottom` |
| `src/components/Sprite.tsx` | `<img>` con cadena de respaldo si un sprite da 404 |

## Convenciones
- En BD se guardan IDs de @pkmn (`charizardmegax`, `heavydutyboots`), nunca nombres. `toSlotView` añade los nombres legibles.
- `moves`, `evs`, `ivs` son JSON en columnas `String` (SQLite). Usa `rowToSlot` / `slotToRow`.
- Siempre hay 6 filas `Slot` por run (`position` 0-5); `species = ""` = vacío. Reordenar usa posiciones temporales (+100) por el índice único.
- `hpMax` se calcula con 31 IVs / 0 EVs (`calcMaxHp`) al reemplazar, evolucionar o cambiar nivel.
- Toda acción nueva debe pasar por `mutate()` en `actions.ts` (auth + historial + SSE).
- El body es transparente a propósito (widget). El fondo del panel lo pone `Panel`.

## Cómo añadir cosas comunes
- **Campo nuevo en un slot**: `schema.prisma` → `npm run db:migrate -- --name x` → `types.ts` (`SlotData`) → `rowToSlot`/`EMPTY_SLOT` en `run.ts` → `SlotPatch` en `actions.ts` → UI.
- **Opción visual nueva del widget**: columna en `Run` → `WidgetConfig` + `runConfig()` → `ConfigPatch` → toggle en `WidgetSettings` → usarla en `Widget.tsx`.
- **Layout nuevo del widget** (torre lateral, burbujas): componente junto a `HudBottom` en `Widget.tsx`, elegir según `config.layout`; ampliar el tipo `layout` y añadir selector en `WidgetSettings`.

## Comandos
- Dev: `npm install` → `npm run setup` (crea `.env` y la BD) → `npm run dev`
- Docker: `docker compose up -d --build` (migraciones automáticas al arrancar)
- Tests: `npm test` (vitest, `src/lib/__tests__`)

## Pendiente / ideas (no implementado)
Layouts torre y burbujas · vista pública para el chat · comandos `!equipo` en Twitch/Kick · login OAuth multiusuario · nombres en español.
