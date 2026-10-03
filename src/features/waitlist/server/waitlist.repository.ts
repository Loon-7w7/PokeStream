import "server-only";
import { prisma, type Db } from "@/core/db/client";

/** Acceso a la tabla BetaApplication (dueña: feature waitlist). `db` siempre es el último parámetro. */

export interface ApplicationInput {
  email: string;
  name: string | null;
  platform: string;
  channel: string;
  message: string | null;
}

export const findApplication = (email: string, db: Db = prisma) => db.betaApplication.findUnique({ where: { email } });

export const listApplications = (db: Db = prisma) => db.betaApplication.findMany({ orderBy: { createdAt: "desc" } });

/** Crea la postulación o actualiza sus datos (el estado no se toca). */
export const upsertApplication = ({ email, ...data }: ApplicationInput, db: Db = prisma) =>
  db.betaApplication.upsert({ where: { email }, update: data, create: { email, ...data } });

export const setApplicationStatus = (email: string, status: "approved" | "rejected", db: Db = prisma) =>
  db.betaApplication.update({ where: { email }, data: { status, reviewedAt: new Date() } });
