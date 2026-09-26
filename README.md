# PartyHUD

Panel web para gestionar tu equipo Pokémon en directo y un widget transparente para OBS que se actualiza al instante.

> "PartyHUD" es un nombre provisional. Cámbialo en `.env` con `APP_NAME`.

## Qué hace
- 6 slots con mote, nivel, PS, habilidad, objeto, naturaleza, teratipo, movimientos, shiny y debilitado.
- **Reemplazo rápido**: botón *Reemplazar* (o tecla `R`) → escribe el nombre → `Enter`.
- Evolucionar con un clic, conservando mote, nivel y movimientos.
- Arrastrar para reordenar, historial de cambios, "Curar a todos".
- Widget para OBS (HUD inferior) que se actualiza en vivo, con opacidad, escala, espaciado y elementos configurables.
- Exportar e importar equipos en formato **Pokémon Showdown**.
- Sprites directos de Showdown (`SPRITES_BASE_URL`), sin descargar imágenes.

**Atajos del panel:** `1`–`6` elegir slot · `R` reemplazar · `E` editar · `F` debilitar/revivir.

## Arrancar con Docker (Windows)
Requisitos: Docker Desktop.

```powershell
copy .env.example .env      # y cambia ADMIN_TOKEN
docker compose up -d --build
```

Abre http://localhost:3000 y entra con tu `ADMIN_TOKEN`.

- Ver logs: `docker compose logs -f`
- Detener: `docker compose down` (los datos se conservan en el volumen `partyhud-data`)
- Actualizar tras cambiar código: `docker compose up -d --build`
- Copia de seguridad de la BD: `docker cp partyhud:/app/data/app.db .\respaldo.db`

## Agregar el widget a OBS
1. En el panel, copia la URL de **Widget para OBS**.
2. En OBS: **Fuentes → + → Navegador**. Pega la URL, ancho `1920`, alto `1080`.
3. Listo. Cada cambio en el panel aparece en OBS al instante.

Si OBS está en otra PC de tu red, cambia `localhost` por la IP de la máquina que corre Docker (ej. `http://192.168.1.50:3000/widget/...`).

Si la URL se filtra, usa **Regenerar URL** en el panel: la anterior deja de funcionar.

## Desarrollo sin Docker
Requisitos: Node.js 22 o superior.

```powershell
npm install
npm run setup     # crea .env (si no existe) y la base de datos
npm run dev       # http://localhost:3000
```

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run check` | Todo: tipos, lint (con reglas de arquitectura), prueba de arquitectura y tests |
| `npm test` | Tests (vitest) |
| `npm run typecheck` / `npm run lint` | Verificación de tipos / lint |
| `npm run db:migrate -- --name cambio` | Crear una migración tras editar `prisma/schema.prisma` |
| `npm run db:studio` | Ver/editar la BD en el navegador |

## Arquitectura
Monolito modular por features con dominio puro y reglas verificadas por ESLint y CI. Ver [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Variables de entorno
| Variable | Descripción |
|---|---|
| `APP_NAME` | Nombre visible de la app |
| `ADMIN_TOKEN` | Contraseña del panel. Vacía = sin login (solo uso local) |
| `DATABASE_URL` | Ruta de SQLite. Docker la fija en `file:/app/data/app.db` |
| `SPRITES_BASE_URL` | Base de los sprites (`https://play.pokemonshowdown.com/sprites/`) |

## Publicarlo más adelante
- Pon un proxy con HTTPS delante (Caddy o Nginx). Con Nginx, desactiva el buffering en `/api/stream/` (la app ya envía `X-Accel-Buffering: no`).
- Usa un `ADMIN_TOKEN` largo y aleatorio.
- Para varios usuarios harán falta login con Twitch/Kick y una run por usuario (ver "Pendiente" en `CLAUDE.md`).
- Con varias instancias del servidor, implementa `RealtimeBus` (`src/core/realtime/bus.ts`) con Redis pub/sub.
