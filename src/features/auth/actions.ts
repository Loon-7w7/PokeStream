"use server";
import { redirect } from "next/navigation";
import { endSession } from ".";

export async function logout() {
  await endSession();
  redirect("/login");
}
