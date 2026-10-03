// Política de privacidad pública. Describe lo que la app guarda de verdad (ver prisma/schema.prisma).
import Link from "next/link";
import type { ReactNode } from "react";

type Props = { appName: string; appUrl: string; contactEmail: string; kofiUrl: string };

export function PrivacyPolicy({ appName, appUrl, contactEmail, kofiUrl }: Props) {
  const contact = contactEmail ? (
    <a href={`mailto:${contactEmail}`} className="text-accent hover:underline">
      {contactEmail}
    </a>
  ) : (
    "el correo de contacto del proyecto"
  );

  return (
    <main className="min-h-screen bg-bg px-4 py-10 text-text">
      <article className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-muted hover:text-text">
          ← Volver
        </Link>
        <h1 className="mt-4 text-3xl font-black tracking-tight">Política de privacidad</h1>
        <p className="mt-2 text-sm text-muted">
          {appName} ({appUrl}) es un proyecto gratuito para streamers. Última actualización: 27 de septiembre de 2026.
        </p>

        <Section title="Qué datos guardamos">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <b>Tu correo de Google</b>, para identificar tu cuenta. No pedimos ni guardamos tu nombre, foto, contactos ni
              contraseña.
            </li>
            <li>
              <b>Tu equipo, tu caja y la configuración de tu widget</b>: especies, motes, objetos, movimientos, posiciones y
              opciones visuales que tú escribes.
            </li>
            <li>
              <b>Si te apuntas a la beta</b> (preregistro): el correo, el nombre o apodo, la plataforma y el canal de
              streaming y el mensaje que escribas, para decidir a quién dar acceso. Puedes pedir que los borremos.
            </li>
            <li>
              <b>Tu sesión</b>: un identificador aleatorio con fecha de caducidad (30 días) para no pedirte entrar cada vez.
            </li>
          </ul>
        </Section>

        <Section title="Para qué los usamos">
          Solo para que funcione la app: mostrarte tu panel y servir tu widget a OBS. No vendemos ni compartimos tus datos, no
          mostramos publicidad y no usamos analítica ni rastreadores.
        </Section>

        <Section title="Cookies">
          Usamos dos cookies propias y necesarias: <code>session</code> (tu sesión) y <code>google_oauth</code> (dura 10
          minutos mientras inicias sesión). No hay cookies de terceros.
        </Section>

        <Section title="Servicios de terceros">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <b>Google</b>, para iniciar sesión. Google trata tus datos según su propia política de privacidad.
            </li>
            <li>
              <b>Pokémon Showdown</b>: los sprites se cargan desde sus servidores, así que tu navegador (y el de OBS) les
              pide las imágenes directamente.
            </li>
            <li>
              <b>Proveedor de base de datos y alojamiento</b>, donde se guardan los datos descritos arriba.
            </li>
            {kofiUrl && (
              <li>
                <b>Ko-fi</b>: las donaciones son opcionales y se hacen en su web; no recibimos tus datos de pago.
              </li>
            )}
          </ul>
        </Section>

        <Section title="El enlace del widget">
          La URL del widget lleva un token secreto: quien la tenga puede ver tu equipo (lo mismo que se ve en tu directo).
          Si se filtra, regenérala desde el panel y la anterior deja de funcionar.
        </Section>

        <Section title="Cuánto tiempo y tus derechos">
          Guardamos tus datos mientras tengas cuenta. Puedes pedir una copia, corregirlos o borrar tu cuenta y todos sus datos
          escribiendo a {contact}. Las sesiones caducadas se eliminan automáticamente.
        </Section>

        <Section title="Aviso">
          {appName} es un proyecto de fans sin relación con Nintendo, Game Freak, Creatures ni The Pokémon Company. Pokémon y
          sus nombres son marcas de sus respectivos dueños.
        </Section>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}
