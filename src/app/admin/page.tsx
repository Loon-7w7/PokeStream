// Administración de la beta cerrada. Capa de rutas: solo conecta la URL con la feature.
import type { Metadata } from "next";
import { getAdminState } from "@/features/admin";
import { AdminPanel } from "@/features/admin/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administración", robots: { index: false } };

export default async function AdminPage() {
  return <AdminPanel state={await getAdminState()} />;
}
