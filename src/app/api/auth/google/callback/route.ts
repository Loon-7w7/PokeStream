// Google vuelve aquí tras el consentimiento. La lógica vive en features/auth.
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { finishGoogleLogin } from "@/features/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  redirect(await finishGoogleLogin(req.nextUrl.searchParams));
}
