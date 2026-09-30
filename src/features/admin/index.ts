import "server-only";
import { notFound, redirect } from "next/navigation";
import { isCurrentUserAdmin, isSignedIn } from "@/features/auth";
import { getAdminState as readAdminState } from "./server/admin.service";

/** API pública (servidor) de admin. Sin sesión -> /login; sin ser admin -> 404 (no revela que existe). */
export async function getAdminState() {
  if (!(await isSignedIn())) redirect("/login");
  if (!(await isCurrentUserAdmin())) notFound();
  return readAdminState();
}
