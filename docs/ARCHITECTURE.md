# Arquitectura

Monolito modular por **features** (vertical slices) con un **kernel compartido** (`core/`) y **dominio puro** dentro de cada feature. Se eligió esto frente a microservicios o "clean architecture" completa porque es una app pequeña, de un proceso, que debe poder crecer (multiusuario, más layouts, bots de chat) sin reescribirse.

Las reglas marcadas con 🔒 las verifica una máquina (`npm run lint` y `npm run lint:arch`, también en CI). Las demás son de revisión.

## 1. Capas

```
src/
├─ app/          Entrega (rutas de Next). Delgada: conecta URL -> feature.
├─ proxy.ts      Comprobación optimista de sesión (no es la autorización real).
├─ features/     Una carpeta por capacidad de negocio.
│  └─ <feature>/
│     ├─ index.ts      API pública de SERVIDOR (server-only)
│     ├─ actions.ts    Server actions (entrada desde el navegador)
│     ├─ types.ts      Tipos públicos (puros, sirven en cliente y servidor)
│     ├─ ui/           Componentes React (index.ts = API pública de UI)
│     ├─ domain/       Reglas de negocio PURAS (opcional)
│     └─ server/       Casos de uso (*.service.ts) y acceso a datos (*.repository.ts)
├─ core/         Kernel compartido. No conoce ninguna feature.
│  ├─ config/env.ts    Variables de entorno validadas con zod
│  ├─ db/client.ts     Prisma + tipo Db
│  ├─ pokedex/         Capa anticorrupción sobre @pkmn (+ códec de Showdown)
│  ├─ realtime/bus.ts  Puerto de tiempo real (memoria hoy, Redis mañana)
│  ├─ action.ts        runAction(): envoltorio de todas las server actions
│  ├─ result.ts        ActionResult, DomainError, fail()
│  └─ ui/              Componentes genéricos (Modal, Sprite, Logo, ActionProvider…)
└─ generated/    Cliente de Prisma (no se edita, no se versiona)
```

### Dirección de dependencias

```
app ──► features ──► core
          │
          └─ dentro de una feature:  actions ─► server/*.service ─► domain
                                                        └──────► server/*.repository ─► core/db
```

Nunca al revés: `core` no importa features 🔒, el dominio no importa servicios, repositorios, Next ni React 🔒.

### Grafo de features (dirigido, sin ciclos) 🔒

```
auth ◄── run ◄── team ◄── showdown
          ▲       ▲
          └─ widget ┘
dashboard ──► (todas)   ← feature de composición; nadie depende de ella
```

Definido en `scripts/check-architecture.mjs` (`ALLOWED`). Añadir una dependencia nueva es una decisión: se edita ahí a propósito.

## 2. Reglas

### Límites
1. 🔒 Otra feature se importa **solo** por su API pública: `@/features/x` (servidor), `@/features/x/actions`, `@/features/x/ui`, `@/features/x/types`. Nunca `@/features/x/server/...`.
2. Dentro de la misma feature se usan **rutas relativas**.
3. 🔒 Solo `core/pokedex` importa `@pkmn/*`. Si la librería cambia, solo se toca esa carpeta.
4. 🔒 Solo `*.repository.ts` y la unidad de trabajo importan `@/core/db`. Los servicios nunca ven Prisma.
5. 🔒 Todo módulo de servidor empieza con `import "server-only"` (build falla si llega al navegador).
6. Cada tabla tiene **una** feature dueña: `Run` y `HistoryEntry` → run; `Slot` → team. Otra feature que necesite esos datos usa la API pública de la dueña.
7. `process.env` solo se lee en `core/config/env.ts` (excepción: `proxy.ts`).

### Mutaciones
8. **Toda** escritura pasa por `mutateRun()` (`features/run/server/unit-of-work.ts`), que:
   exige admin → resuelve la run → ejecuta en **una transacción** junto con el historial → publica el evento de tiempo real **después** del commit.
9. Los repositorios reciben `db` como **último** parámetro (por defecto el cliente global). Dentro de `mutateRun` se les pasa la transacción.
10. Las reglas de negocio (PS, debilitado, evolución, orden…) viven en `domain/` como funciones puras que devuelven `{ slot, message }`. Se testean sin BD.

### Server actions
11. Una action hace exactamente: **validar con zod → llamar a un caso de uso → devolver `ActionResult`** vía `runAction()`. Sin lógica.
12. Las actions **nunca lanzan** al cliente: en producción Next oculta el mensaje de los errores lanzados. Errores esperados = `fail(code, "mensaje en español")`; los inesperados se registran y se muestra un texto genérico.
13. Tras mutar, `runAction(..., { refresh: true })` llama a `refresh()`: Next re-renderiza los Server Components y el panel recibe el estado nuevo en la misma respuesta. El cliente no guarda copias del estado del servidor.
14. Para respuesta instantánea se usa `useOptimistic` (reordenar, checkboxes, toggles). Si la acción falla, React descarta el valor optimista solo.

### Datos
15. En BD se guardan **IDs** de Showdown (`charizardmegax`, `heavydutyboots`), nunca nombres. Los nombres se resuelven al mostrar (`describeSet`).
16. Validación en los bordes: zod en actions y en el entorno. Dentro, los tipos se dan por buenos.
17. Cambios de esquema solo con migraciones (`npm run db:migrate -- --name x`). Nunca editar una migración ya aplicada.

### Tiempo real y contrato del widget
18. El widget recibe `WidgetState` (`features/widget/types.ts`): un **contrato versionado** (`v`). Solo contiene lo necesario para pintar: nada de tokens, EVs ni movimientos.
19. El widget no tiene lógica de negocio: pinta lo que llega por SSE.
20. El bus es una interfaz (`RealtimeBus`). Para varias instancias, implementarla con Redis; nada más cambia.

### Identidad
21. `getCurrentRun()` es el **único** lugar que decide qué run usa el usuario. Para multiusuario se cambia ahí (sesión → run) y se añade `ownerId` a `Run`.
22. `requireAdmin()` es la autorización real; `proxy.ts` solo redirige para comodidad.

### Calidad
23. `npm run check` debe pasar antes de cada commit: tipos, lint (incluye límites), prueba de arquitectura y tests.
24. Pirámide de tests: dominio (unitarios, rápidos) > servicios contra SQLite temporal (integración) > e2e manual/Playwright.
25. Código y comentarios pueden estar en español; identificadores en inglés.

## 3. Flujos

**Reemplazo rápido**
`TeamSection` (R / botón) → `SpeciesPicker` → `replaceSpecies` action → zod → `team.service.replaceSpecies` → `mutateRun` [ `domain.placeSpecies` → `slot.repository.saveSlot` → historial ] commit → `bus.publish` → SSE → widget se repinta · `refresh()` → panel se repinta.

**Widget en OBS**
`/widget/[token]` (SSR con estado inicial) → `EventSource /api/stream/[token]` → `widget.service.createWidgetStream` → en cada evento: valida token (revocado → `revoked`) → `getWidgetState` → `event: state`.

## 4. Cómo extender

| Quiero… | Dónde |
|---|---|
| Nueva regla de juego (p. ej. límite de nivel) | `features/team/domain/slot.ts` + test |
| Nuevo campo en un slot | migración → `SlotData` → `slot.repository` (toSlot/toRow) → zod en `team/actions.ts` → UI |
| Nueva opción visual del widget | migración (columna en Run) → `WidgetConfig` + `toWidgetConfig` → zod en `run/actions.ts` → `WidgetSettings` → `Widget` |
| Nuevo layout (torre, burbujas) | componente en `features/widget/ui/`, elegir por `config.layout` |
| Nueva capacidad (p. ej. comandos de chat) | `features/chat/` con su `index.ts`; declarar sus dependencias en `ALLOWED` |
| Multiusuario | `ownerId` en Run, `getCurrentRun()` desde la sesión, OAuth en `features/auth` |
| Varias instancias | implementar `RealtimeBus` con Redis en `core/realtime` |
