"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyToken } from ".";

export async function login(_prev: unknown, form: FormData): Promise<{ error: string } | undefined> {
  const token = String(form.get("token") ?? "");
  if (!verifyToken(token)) return { error: "Contraseña incorrecta" };
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true cuando se sirva por HTTPS
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/login");
}
