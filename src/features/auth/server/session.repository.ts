import "server-only";
import { prisma, type Db } from "@/core/db/client";

/** Acceso a la tabla Session (dueña: feature auth). `db` siempre es el último parámetro. */

export const createSession = (id: string, email: string, expiresAt: Date, db: Db = prisma) =>
  db.session.create({ data: { id, email, expiresAt } });

export const findSession = (id: string, db: Db = prisma) => db.session.findUnique({ where: { id } });

export const deleteSession = (id: string, db: Db = prisma) => db.session.deleteMany({ where: { id } });

export const deleteExpiredSessions = (now: Date, db: Db = prisma) => db.session.deleteMany({ where: { expiresAt: { lte: now } } });
