# PartyHUD

Panel web para gestionar tu equipo Pokémon en directo y un widget transparente para OBS que se actualiza al instante.

> "PartyHUD" es un nombre provisional. Cámbialo en `.env` con `APP_NAME`.

## Qué hace
- 6 slots (todos nivel 50) con mote, habilidad, objeto, naturaleza, teratipo, movimientos, shiny y debilitado.
- **Reemplazo rápido**: botón *Reemplazar* (o tecla `R`) → escribe el nombre → `Enter`.
- Evolucionar con un clic, conservando mote y movimientos.
- Arrastrar para reordenar, modo Nuzlocke (un debilitado no puede revivir).
- Caja con los Pokémon que salen del equipo (se pueden devolver) y pestaña de Muertos del Nuzlocke.
- Widget para OBS (HUD inferior) que se actualiza en vivo, con opacidad, escala, espaciado y elementos configurables.
- Exportar el equipo en formato **Pokémon Showdown** e importar Pokémon desde Showdown directo a la caja.
- Sprites directos de Showdown (`SPRITES_BASE_URL`), sin descargar imágenes.

**Atajos del panel:** `1`–`6` elegir slot · `R` reemplazar · `E` editar · `F` debilitar/revivir.

## Arrancar con Docker (Windows)
Requisitos: Docker Desktop.

```powershell
copy .env.example .env      # y configura el login con Google (abajo)
docker compose up -d --build
```

Abre http://localhost:3000 y entra con tu cuenta de Google (o directo si el login está desactivado).

- Ver logs: `docker compose logs -f`
- Detener: `docker compose down` (los datos se conservan en el volumen `partyhud-data`)
- Actualizar tras cambiar código: `docker compose up -d --build`
- Copia de seguridad de la BD: `docker cp partyhud:/app/data/app.db .\respaldo.db`

## Agregar el widget a OBS
1. En el panel, copia la URL de **Widget para OBS**.
2. En OBS: **Fuentes → + → Navegador**. Pega la URL, ancho `1920`, alto `1080`.
3. Listo. Cada cambio en el panel aparece en OBS al instante.

Si OBS está en otra PC de tu red, pon `APP_BIND="0.0.0.0"` en `.env` (por defecto Docker solo escucha en esta máquina) y cambia `localhost` por la IP de la máquina que corre Docker (ej. `http://192.168.1.50:3000/widget/...`).

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

## Login con Google
1. En [Google Cloud Console](https://console.cloud.google.com/apis/credentials) crea un **ID de cliente OAuth** de tipo *Aplicación web* (si te lo pide, configura antes la pantalla de consentimiento como *Externa* y añade tus correos como usuarios de prueba).
2. En *URI de redireccionamiento autorizados* añade `http://localhost:3000/api/auth/google/callback` y, si lo publicas, `https://tu-dominio/api/auth/google/callback`.
3. Copia el ID y el secreto a `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, genera `SESSION_SECRET` y pon tu correo en `ADMIN_EMAILS` y en `LEGACY_OWNER_EMAIL` para conservar el equipo que ya tenías. Por defecto solo entran cuentas invitadas: invita correos o abre el registro desde **/admin**.

## Variables de entorno
| Variable | Descripción |
|---|---|
| `APP_NAME` | Nombre visible de la app |
| `APP_URL` | URL pública sin `/` final (`http://localhost:3000`). Con `https://` las cookies son `Secure` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Cliente OAuth de Google. Vacío = sin login: en producción el servidor no arranca salvo con `ALLOW_NO_AUTH=true` |
| `ALLOW_NO_AUTH` | `true` permite producción sin login (solo en tu red local) |
| `SESSION_SECRET` | Firma de la cookie de sesión (32+ caracteres). Cambiarla cierra todas las sesiones; cerrar sesión borra la sesión de la BD |
| `ADMIN_EMAILS` | Administradores (separados por comas). Entran siempre y gestionan el acceso en `/admin`: registro abierto o solo invitados, invitaciones y bloqueos |
| `LEGACY_OWNER_EMAIL` | Correo que se queda con el equipo creado antes del multiusuario |
| `KOFI_URL` | Enlace de donación (`https://`). Vacío = sin botón |
| `CONTACT_EMAIL` | Contacto que aparece en `/privacidad` |
| `DATABASE_URL` | SQLite local (`file:`; Docker la fija en `file:/app/data/app.db`) o libsql remoto (`libsql:`/`https:`/`wss:`; `http:`/`ws:` solo en localhost) |
| `DATABASE_AUTH_TOKEN` | Token de la BD remota. Nunca dentro de la URL |
| `APP_BIND` | Docker: interfaz del puerto 3000. `127.0.0.1` (defecto) solo esta máquina; `0.0.0.0` toda tu red |
| `TUNNEL_TOKEN` | Token de Cloudflare Tunnel con dominio fijo. Vacío = URL temporal (ver `docs/DEPLOY-LAPTOP.md`) |
| `SPRITES_BASE_URL` | Base de los sprites (`https://play.pokemonshowdown.com/sprites/`) |

## Publicarlo más adelante
- **Versión de prueba desde una laptop Windows** (Docker + Cloudflare Tunnel, sin abrir puertos): `docs/DEPLOY-LAPTOP.md`.
- Pon un proxy con HTTPS delante (Caddy o Nginx). Con Nginx, desactiva el buffering en `/api/stream/` (la app ya envía `X-Accel-Buffering: no`).
- Añade `{APP_URL}/api/auth/google/callback` como URI de redirección en tu cliente OAuth de Google (uno por cada URL: local y producción).
- Para varios usuarios harán falta login con Twitch/Kick y una run por usuario (ver "Pendiente" en `CLAUDE.md`).
- Con varias instancias del servidor, implementa `RealtimeBus` (`src/core/realtime/bus.ts`) con Redis pub/sub.
