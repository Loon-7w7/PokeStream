import { redirect } from "next/navigation";
import { env } from "@/core/config/env";
import { isAuthEnabled, isSignedIn } from "@/features/auth";
import { LoginCard } from "@/features/auth/ui";

export const dynamic = "force-dynamic"; // APP_NAME se lee en tiempo de ejecución

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!isAuthEnabled() || (await isSignedIn())) redirect("/");
  const { error } = await searchParams;
  return <LoginCard appName={env.APP_NAME} kofiUrl={env.KOFI_URL} error={error} />;
}
