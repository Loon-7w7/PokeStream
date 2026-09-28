# Publicación: dónde y cómo

Guía de despliegue recomendada para la versión multiusuario (gratis, con donaciones por Ko-fi).

> Estado: decisión tomada, archivos de despliegue **pendientes** (`docker-compose.prod.yml`, `Caddyfile`, `litestream.yml`).
> Los precios son aproximados; revísalos antes de contratar.

## Por qué no sirve cualquier hosting

La arquitectura de la app impone estas condiciones:

1. **El widget mantiene una conexión SSE abierta durante horas** (todo el directo). Las plataformas serverless cortan las funciones a los segundos/minutos.
2. **El tiempo real vive en memoria** (`src/core/realtime/bus.ts`): hace falta **un solo proceso siempre encendido**.
3. **No puede dormirse**: si el servidor se apaga por inactividad, el widget de OBS se queda en blanco en pleno directo.
4. **Presupuesto bajo**: solo entran donaciones.

## Comparativa

| Opción | Encaja | Coste aprox. | Comentario |
|---|---|---|---|
| **VPS (Hetzner, DigitalOcean, Contabo) + Docker** | ✅ Mejor | 4–6 €/mes | Ya existen `Dockerfile` y `docker-compose.yml`. SSE y bus en memoria funcionan sin cambios. Un VPS pequeño aguanta cientos de widgets conectados. |
| **Oracle Cloud Free Tier** | ✅ Si quieres 0 € | Gratis | Igual que un VPS, pero el registro es exigente y a veces reclaman las máquinas inactivas. |
| **Fly.io / Railway** | 🟡 Bien | ~5 $/mes | Despliegan el Docker sin administrar servidor. Fijar **una sola instancia** y desactivar el auto-apagado. |
| **Render (gratis)** | ❌ | — | El plan gratis se duerme: el widget se cae. |
| **Vercel / Netlify** | ❌ | — | Serverless: cortan el SSE y el bus en memoria no funciona entre instancias. El plan Hobby de Vercel es solo para uso no comercial (las donaciones quedan en zona gris). |

### Base de datos: SQLite en el VPS o Turso

En un VPS lo recomendado es **SQLite en el propio servidor** (como ya hace Docker) en lugar de Turso:

- Mucho más rápido: cada consulta a Turso cruza internet y el panel hace varias por acción.
- Sin el problema de migraciones: `prisma migrate deploy` funciona con `file:`; contra `libsql://` hay que verificarlo.
- Solo hace falta añadir **copias de seguridad** con Litestream.

Turso tiene sentido con Fly.io/Railway o si se quiere la BD separada del servidor. El código soporta ambas (`DATABASE_URL` + `DATABASE_AUTH_TOKEN`).

## Recomendación

**Hetzner + Docker Compose + Caddy (HTTPS) + SQLite en volumen + Litestream (copias a Cloudflare R2).**
Unos 6 €/mes y sin cambios de código.

## Cómo funciona

```
 Espectadores / OBS / tu navegador
              │  https://tudominio.com
              ▼
 ┌─────────────────── VPS Hetzner (Linux, ~5 €/mes) ───────────────────┐
 │                                                                     │
 │  ┌─────────┐   http interno  ┌──────────────┐    lee/escribe         │
 │  │  Caddy  │ ──────────────▶ │  App         │ ─────────────┐         │
 │  │ :80/:443│                 │  (Next.js)   │              ▼         │
 │  └─────────┘                 │  :3000       │       ┌────────────┐   │
 │   HTTPS automático           └──────────────┘       │  app.db    │   │
 │                                                     │  (SQLite)  │   │
 │                              ┌──────────────┐ vigila└────────────┘   │
 │                              │  Litestream  │ ◀──────────┘           │
 │                              └──────┬───────┘                        │
 └─────────────────────────────────────┼───────────────────────────────┘
                                       │ copia continua (cada pocos segundos)
                                       ▼
                         Cloudflare R2 / Backblaze B2
```

### Qué hace cada pieza

**VPS (Hetzner).** Un ordenador Linux alquilado, siempre encendido y con IP pública. Se entra por SSH, se instala Docker una vez. El más pequeño (2 CPU, 4 GB) sobra.

**Caddy (el portero).** Lo único expuesto a internet (puertos 80 y 443):
- Obtiene y **renueva solo el certificado HTTPS** (Let's Encrypt); basta con indicarle el dominio.
- Reenvía las peticiones a la app por la red interna de Docker; la app deja de estar expuesta directamente.
- Deja pasar las conexiones SSE del widget sin cortarlas.

**La app.** El mismo contenedor del `Dockerfile`. Al arrancar aplica migraciones y sirve panel, login y widget. Al ser **un solo proceso siempre encendido**, el bus en memoria funciona: un cambio en el panel llega al instante a los widgets.

**SQLite en un volumen.** `app.db` vive en un volumen de Docker del servidor: sobrevive a reinicios y actualizaciones. Las consultas tardan microsegundos porque no salen del servidor.

**Litestream (copias de seguridad).** Vigila `app.db` y sube cada cambio a R2/B2 cada pocos segundos. Si el servidor se rompe, en uno nuevo se ejecuta `litestream restore` y se recupera la BD hasta casi el último segundo.

## Día a día

### Montaje (una vez, ~1 hora)

1. Comprar el dominio (**sin "Pokémon" ni "Poké"** en el nombre, por marcas) y crear el VPS con Ubuntu.
2. En el DNS del dominio, un registro `A` apuntando a la IP del VPS.
3. Instalar Docker en el VPS y clonar el repo.
4. Crear el `.env`: secretos, `APP_URL=https://tudominio.com`, `LEGACY_OWNER_EMAIL`, `CONTACT_EMAIL`, claves de R2.
5. En Google Cloud Console:
   - URI de redirección: `https://tudominio.com/api/auth/google/callback`.
   - Pantalla de consentimiento: añadir `https://tudominio.com/privacidad` y pasar la app a **En producción** (en modo prueba solo entran los usuarios de prueba).
6. `docker compose -f docker-compose.prod.yml up -d`.
7. **Entrar primero con Google** con el correo de `LEGACY_OWNER_EMAIL` para quedarte con el equipo antiguo.

### Actualizar la app

```bash
git pull && docker compose -f docker-compose.prod.yml up -d --build
```

Hay unos segundos de corte; el widget se reconecta solo (`retry: 2000` en el SSE) y OBS no se entera.

### Mantenimiento

- Caddy renueva certificados solo, Litestream copia solo y `restart: unless-stopped` levanta la app si se cae o se reinicia el servidor.
- Activar actualizaciones automáticas de seguridad de Ubuntu (`unattended-upgrades`).
- Firewall que solo abra los puertos 22, 80 y 443.

## Costes

| Concepto | Precio |
|---|---|
| VPS Hetzner (el más pequeño) | ~4–5 €/mes |
| Dominio | ~10–15 €/año |
| Cloudflare R2 (copias) | Gratis hasta 10 GB (la BD pesa pocos MB) |
| Caddy, Litestream, Docker | Gratis |
| **Total** | **~6 €/mes** |

## Límites y cuándo cambiar

- **Un solo servidor = un punto de fallo.** Si Hetzner tiene una avería, la app cae hasta que vuelva. Con Litestream no se pierden datos. Riesgo razonable para un proyecto gratuito.
- Aguanta **cientos o pocos miles de streamers** a la vez. Si se queda corto:
  1. Subir el VPS de tamaño (un clic).
  2. Solo con muchísimo tráfico: varias instancias + `RealtimeBus` con Redis (`src/core/realtime`) + BD remota.

## Aviso legal

Pokémon, sus nombres y sprites son de Nintendo / Game Freak / The Pokémon Company. Con solo donaciones el riesgo es menor que cobrando, pero:

- No usar "Pokémon" en el nombre, el dominio ni la marca.
- Mantener el aviso de proyecto de fans (ya está en `/privacidad`).
- Los sprites se cargan desde Pokémon Showdown; podrían bloquear su uso desde otros sitios.
