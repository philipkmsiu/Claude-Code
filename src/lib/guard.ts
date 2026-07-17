import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCase } from "@/lib/repo";
import type { Case, User } from "@/lib/types";

export async function guardUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Guards a user AND that they may access the given case. Returns both, or
// redirects. Prevents rendering any case screen without an authorised session.
export async function guardCase(caseId: string): Promise<{ user: User; case: Case }> {
  const user = await guardUser();
  const c = await getCase(caseId);
  if (!c) redirect("/cases");
  return { user, case: c };
}
