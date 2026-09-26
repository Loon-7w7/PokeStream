// Panel de control. Capa de rutas: solo conecta la URL con la feature.
import { getDashboardState } from "@/features/dashboard";
import { Dashboard } from "@/features/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <Dashboard state={await getDashboardState()} />;
}
