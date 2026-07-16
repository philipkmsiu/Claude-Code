"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";
import { addAudit } from "@/lib/repo";

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Email and password are required." };
  const user = await login(email, password);
  if (!user) return { error: "Invalid email or password." };
  await addAudit(null, user.id, "auth.login", `${user.email} logged in`);
  redirect("/cases");
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/login");
}
