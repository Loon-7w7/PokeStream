"use client";
import { useActionState } from "react";
import { login } from "@/app/actions";

export function LoginForm({ appName }: { appName: string }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6">
      <h1 className="mb-1 text-xl font-bold">{appName}</h1>
      <p className="mb-4 text-sm text-muted">Escribe la contraseña del panel (ADMIN_TOKEN).</p>
      <input
        name="token"
        type="password"
        autoFocus
        required
        className="w-full rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
      />
      {state?.error && <p className="mt-2 text-sm text-bad">{state.error}</p>}
      <button disabled={pending} className="mt-4 w-full rounded-lg bg-accent py-2 font-semibold text-bg disabled:opacity-60">
        Entrar
      </button>
    </form>
  );
}
