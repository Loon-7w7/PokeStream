import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic"; // APP_NAME se lee en tiempo de ejecución

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg p-4 text-text">
      <LoginForm appName={process.env.APP_NAME || "PartyHUD"} />
    </div>
  );
}
