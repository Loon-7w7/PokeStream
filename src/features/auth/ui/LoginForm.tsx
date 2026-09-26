"use client";
import { useActionState } from "react";
import { Logo } from "@/core/ui/Logo";
import { login } from "../actions";

export function LoginForm({ appName }: { appName: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6">
      <div className="mb-4 flex items-center gap-3">
        <Logo size={44} />
        <h1 className="text-xl font-bold">{appName}</h1>
      </div>
      <p className="mb-4 text-sm text-muted">Escribe la contraseña del panel (ADMIN_TOKEN).</p>
      <input
        name="token"
        type="password"
        autoFocus
        required
        aria-label="Contraseña"
        className="w-full rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
      />
      {state?.error && <p className="mt-2 text-sm text-bad">{state.error}</p>}
      <button disabled={pending} className="mt-4 w-full rounded-lg bg-accent py-2 font-semibold text-bg disabled:opacity-60">
        Entrar
      </button>
    </form>
  );
}
