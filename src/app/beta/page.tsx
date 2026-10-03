// Preregistro a la beta (público). Desaparece cuando el registro está abierto para todos.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { env } from "@/core/config/env";
import { isWaitlistOpen } from "@/features/waitlist";
import { BetaSignupForm } from "@/features/waitlist/ui";

export const dynamic = "force-dynamic"; // depende del modo de registro y de APP_NAME en tiempo de ejecución
export const metadata: Metadata = { title: "Preregistro a la beta" };

export default async function BetaPage() {
  if (!(await isWaitlistOpen())) redirect("/login");
  return <BetaSignupForm appName={env.APP_NAME} kofiUrl={env.KOFI_URL} />;
}
