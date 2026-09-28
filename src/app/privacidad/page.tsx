// Política de privacidad (pública). La exige Google para publicar la app OAuth.
import type { Metadata } from "next";
import { env } from "@/core/config/env";
import { PrivacyPolicy } from "@/features/legal/ui";

export const dynamic = "force-dynamic"; // APP_NAME y CONTACT_EMAIL se leen en tiempo de ejecución
export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacyPage() {
  return <PrivacyPolicy appName={env.APP_NAME} appUrl={env.APP_URL} contactEmail={env.CONTACT_EMAIL} kofiUrl={env.KOFI_URL} />;
}
