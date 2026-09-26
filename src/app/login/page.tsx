import { env } from "@/core/config/env";
import { LoginForm } from "@/features/auth/ui";

export const dynamic = "force-dynamic"; // APP_NAME se lee en tiempo de ejecución

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg p-4 text-text">
      <LoginForm appName={env.APP_NAME} />
    </div>
  );
}
