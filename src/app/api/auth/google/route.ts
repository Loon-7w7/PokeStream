// Inicio del login con Google. La lógica vive en features/auth.
import { redirect } from "next/navigation";
import { startGoogleLogin } from "@/features/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  redirect(await startGoogleLogin());
}
