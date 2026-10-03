import "server-only";
import { isRegistrationOpen, requireAdmin } from "@/features/auth";
import * as service from "./server/waitlist.service";

/**
 * API pública (servidor) del preregistro a la beta. Solo existe mientras el registro está cerrado:
 * al abrirlo para todos, /beta redirige a /login y no se aceptan envíos.
 * Listar y revisar postulaciones es solo para admins.
 */

export const isWaitlistOpen = async () => !(await isRegistrationOpen());

export async function listApplications() {
  await requireAdmin();
  return service.listApplications();
}

export async function reviewApplication(email: string, to: "approved" | "rejected") {
  await requireAdmin();
  return service.reviewApplication(email, to);
}
