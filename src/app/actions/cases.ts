"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { guardUser } from "@/lib/guard";
import { createCase, createIssue, addAudit } from "@/lib/repo";

export async function createCaseAction(formData: FormData): Promise<void> {
  const user = await guardUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const c = await createCase({
    name,
    reference: String(formData.get("reference") || "").trim(),
    claimant: String(formData.get("claimant") || "").trim(),
    respondent: String(formData.get("respondent") || "").trim(),
    tribunal: String(formData.get("tribunal") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    createdBy: user.id,
  });
  await addAudit(c.id, user.id, "case.create", `Created case "${c.name}"`);
  revalidatePath("/cases");
  redirect(`/cases/${c.id}`);
}

export async function createIssueAction(caseId: string, formData: FormData): Promise<void> {
  const user = await guardUser();
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  await createIssue(
    caseId,
    {
      title,
      claimantPosition: String(formData.get("claimantPosition") || "").trim(),
      respondentPosition: String(formData.get("respondentPosition") || "").trim(),
    },
    user.id,
  );
  revalidatePath(`/cases/${caseId}/issues`);
}
