import "server-only";
import { prisma, type Db } from "@/core/db/client";

/** Acceso a las tablas Access y AccessSettings (dueña: feature auth). `db` siempre es el último parámetro. */

export const findAccess = (email: string, db: Db = prisma) => db.access.findUnique({ where: { email } });

export const listAccess = (db: Db = prisma) => db.access.findMany({ orderBy: { createdAt: "desc" } });

export const upsertAccess = (email: string, patch: { invited?: boolean; blocked?: boolean; lastLoginAt?: Date }, db: Db = prisma) =>
  db.access.upsert({ where: { email }, update: patch, create: { email, ...patch } });

/** Borra la fila si ya no aporta nada: ni invitado, ni bloqueado, ni ha entrado nunca. */
export const pruneAccess = (email: string, db: Db = prisma) => db.access.deleteMany({ where: { email, invited: false, blocked: false, lastLoginAt: null } });

export async function getRegistrationOpen(db: Db = prisma): Promise<boolean> {
  return (await db.accessSettings.findUnique({ where: { id: 1 } }))?.registrationOpen ?? false;
}

export const setRegistrationOpen = (registrationOpen: boolean, db: Db = prisma) =>
  db.accessSettings.upsert({ where: { id: 1 }, update: { registrationOpen }, create: { id: 1, registrationOpen } });
