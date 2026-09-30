// Reglas de acceso (beta cerrada). DOMINIO PURO.

/** Lo que se sabe de un correo en la lista de acceso (null = no aparece). */
export interface AccessEntry {
  email: string;
  invited: boolean;
  blocked: boolean;
}

export interface AccessContext {
  isAdmin: boolean;
  entry: AccessEntry | null;
  /** true = cualquiera puede registrarse · false = solo invitados. */
  registrationOpen: boolean;
}

/** ¿Puede este correo usar el panel? Admin siempre; bloqueado nunca; si no, abierto o invitado. */
export function canEnter({ isAdmin, entry, registrationOpen }: AccessContext): boolean {
  if (isAdmin) return true;
  if (entry?.blocked) return false;
  return registrationOpen || Boolean(entry?.invited);
}

/** Correo normalizado: sin espacios y en minúsculas (Google devuelve el correo tal cual se registró). */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Lista pegada por el admin ("a@x.com, b@x.com" o uno por línea) -> correos únicos normalizados. */
export const parseEmailList = (text: string) => [
  ...new Set(
    text
      .split(/[\s,;]+/)
      .map(normalizeEmail)
      .filter(Boolean),
  ),
];
