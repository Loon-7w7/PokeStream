# Versión de prueba en una laptop Windows

Beta para testers por internet sin VPS: la laptop corre la app en Docker y **Cloudflare Tunnel** le da una URL pública con HTTPS (necesario para el login con Google) **sin abrir puertos del router**. El túnel también va en Docker, así que no hay que instalar `cloudflared`.

```
 Testers / OBS ──https──▶ Cloudflare ◀──conexión saliente── cloudflared (Docker) ──▶ app:3000 (Docker) ──▶ app.db (volumen)
                                                            └──────────────── laptop Windows ────────────────┘
```

Para la publicación definitiva sigue en pie `docs/DEPLOY.md` (VPS). Esto sirve para probar con pocos usuarios.

## Qué necesitas

| Qué | Notas |
|---|---|
| Windows 10/11 de 64 bits | Con la virtualización activada en la BIOS (Docker la necesita) |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Con el backend WSL2 (lo propone el instalador) |
| [Git](https://git-scm.com/download/win) | Para clonar el repo |
| Proyecto en Google Cloud Console | El mismo cliente OAuth que usas en local |
| (Opcional) Dominio en Cloudflare | Para una URL fija. Ver [Modo B](#modo-b-dominio-fijo-recomendado-para-una-beta-larga) |

No hace falta Node: todo se compila dentro de Docker.

## Primera vez

1. **Clonar** el repo:
   ```powershell
   git clone <url-del-repo> PokeStream
   cd PokeStream
   ```
2. **Configurar `.env`**: copia `.env.example` a `.env` y rellena al menos:
   ```env
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   ADMIN_EMAILS="tu@correo.com"
   LEGACY_OWNER_EMAIL="tu@correo.com"
   CONTACT_EMAIL="tu@correo.com"
   ```
   No hace falta tocar `APP_URL` ni `SESSION_SECRET`: el script los rellena.
3. **Arrancar**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\laptop.ps1
   ```
   La primera vez tarda unos minutos (construye la imagen). Al terminar muestra la URL pública y la URI de redirección.
4. **Google Cloud Console**:
   - *Credenciales → tu cliente OAuth → URI de redireccionamiento autorizados*: añade la URI que mostró el script (`https://…/api/auth/google/callback`).
   - *Pantalla de consentimiento*: déjala en **modo de prueba** y añade los correos de los testers como **usuarios de prueba** (hasta 100). Así no hace falta la verificación de Google.
5. **Entra tú primero** con el correo de `LEGACY_OWNER_EMAIL` (te quedas con el equipo antiguo) y en **/admin** invita a los testers.

## Comandos del día a día

| Qué | Comando (`powershell -ExecutionPolicy Bypass -File …`) |
|---|---|
| Levantar o actualizar (tras `git pull`) | `.\scripts\laptop.ps1` |
| Ver la URL pública | `.\scripts\laptop.ps1 url` |
| Logs en vivo | `.\scripts\laptop.ps1 logs` |
| Detener (los datos se conservan) | `.\scripts\laptop.ps1 down` |
| Copia de seguridad de la BD | `docker cp partyhud:/app/data/app.db .\respaldo.db` |

## Modo A: URL temporal (sin dominio)

Es el modo por defecto (con `TUNNEL_TOKEN` vacío). Es gratis y no necesita cuenta, pero **la URL `*.trycloudflare.com` cambia cada vez que se recrea o reinicia el túnel** (al reiniciar la laptop o Docker, por ejemplo). Cuando cambie:

1. Ejecuta `.\scripts\laptop.ps1`: detecta la URL nueva, actualiza `APP_URL` y reinicia la app.
2. Añade la URI nueva en Google Cloud Console.
3. Avisa a los testers: **la URL del widget en OBS cambió**. Tienen que copiarla otra vez desde el panel.

Va bien para una prueba de horas o de un día. Cloudflare no da garantías de disponibilidad en este modo.

## Modo B: dominio fijo (recomendado para una beta larga)

Necesitas un dominio gestionado por Cloudflare. Puedes comprarlo en Cloudflare Registrar (~10 USD/año) o cambiar los nameservers del que ya tengas. Te servirá también para el VPS. **Que no lleve "Pokémon" ni "Poké"** (ver aviso legal en `docs/DEPLOY.md`).

1. En el panel de Cloudflare: **Zero Trust → Networks → Tunnels → Create a tunnel → Cloudflared**. Ponle un nombre (ej. `partyhud-laptop`).
2. En la pantalla de instalación, copia el **token** (la cadena larga tras `--token` en cualquiera de los comandos). No instales nada: el contenedor ya lo hace.
3. En **Public hostname**: subdominio `beta`, tu dominio y servicio **HTTP** → `app:3000`.
4. En `.env`:
   ```env
   APP_URL="https://beta.tudominio.com"
   TUNNEL_TOKEN="eyJ..."
   ```
5. Ejecuta `.\scripts\laptop.ps1` y pon `https://beta.tudominio.com/api/auth/google/callback` en Google (una sola vez).

La URL ya no cambia: los widgets de OBS siguen funcionando tras reinicios.

## Que la laptop aguante

- **Energía**: *Configuración → Sistema → Energía*. Que la pantalla se apague si quieres, pero **suspensión: Nunca** (enchufada). Si es portátil, configura que **cerrar la tapa no haga nada**.
- **Docker Desktop**: *Settings → General → Start Docker Desktop when you sign in*. Los contenedores tienen `restart: unless-stopped` y vuelven solos.
- **Inicio de sesión automático en Windows**: si no, tras un reinicio Docker no arranca hasta que alguien entre.
- **Windows Update**: configura un *horario activo* amplio para que no reinicie durante los directos.
- En el Modo A, después de cada reinicio ejecuta `.\scripts\laptop.ps1` (la URL habrá cambiado).

## Seguridad

- El puerto 3000 solo escucha en la propia laptop (`APP_BIND="127.0.0.1"`): desde internet solo se entra por el túnel, y desde la Wi-Fi donde esté la laptop no se ve.
- El script no arranca si falta el login con Google: expuesta a internet, la app nunca va sin login.
- `.env` tiene secretos: no lo compartas ni lo subas a Git (ya está en `.gitignore`).

## Problemas comunes

| Síntoma | Causa / solución |
|---|---|
| `Docker no está corriendo` | Abre Docker Desktop y espera a *Engine running* |
| `no se puede cargar el archivo … ejecución de scripts deshabilitada` | Ejecútalo con `powershell -ExecutionPolicy Bypass -File …` como en los ejemplos |
| Google: `redirect_uri_mismatch` | La URI en Google no coincide con `APP_URL` + `/api/auth/google/callback` (en el Modo A, la URL cambió) |
| Google: `access_denied` / la app no está verificada | El correo no está en *usuarios de prueba* de la pantalla de consentimiento |
| El tester entra con Google pero no pasa | No está invitado: invítalo en **/admin** o abre el registro |
| El widget de OBS se queda en blanco | En el Modo A cambió la URL: copiar la nueva desde el panel |

## Resumen rápido

1. Instala Docker Desktop y Git, y clona el repo.
2. Copia `.env.example` a `.env` y rellena `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y tu correo en `ADMIN_EMAILS` / `LEGACY_OWNER_EMAIL`.
3. `powershell -ExecutionPolicy Bypass -File .\scripts\laptop.ps1`
4. En Google Cloud Console: añade la URI que muestra el script y a los testers como *usuarios de prueba*.
5. Entra tú primero e invita a los testers en `/admin`.

> Sin dominio, la URL cambia al reiniciar la laptop o Docker (y con ella la del widget en OBS de los testers). Para una beta de más de un día, usa el [Modo B](#modo-b-dominio-fijo-recomendado-para-una-beta-larga).
>
> Si usas OBS en otra PC de tu red (sin túnel), pon `APP_BIND="0.0.0.0"` en tu `.env`.

## Archivos de este despliegue

| Archivo | Qué hace |
|---|---|
| `docker-compose.yml` | El puerto escucha por defecto solo en `127.0.0.1`. `APP_BIND="0.0.0.0"` en `.env` lo abre a la red local (OBS en otra PC por IP) |
| `docker-compose.tunnel.yml` | Túnel en un contenedor de `cloudflared` (no hay que instalarlo). Perfiles: `quick` (URL temporal `trycloudflare`, sin cuenta) y `fixed` (dominio fijo con `TUNNEL_TOKEN`) |
| `scripts/laptop.ps1` | Un solo comando: comprueba Docker, crea `.env` si falta, genera `SESSION_SECRET`, **no arranca sin login de Google**, levanta el túnel, escribe su URL en `APP_URL`, levanta la app, espera a que responda y muestra la URI para Google. Acciones: `up` (por defecto), `url`, `logs`, `down` |
| `.env.example` | Documenta `APP_BIND` y `TUNNEL_TOKEN` |
