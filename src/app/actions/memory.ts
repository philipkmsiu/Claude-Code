"use server";

import { revalidatePath } from "next/cache";
import { guardUser } from "@/lib/guard";
import { approveMemory, reviewMemory } from "@/lib/repo";

export async function approveMemoryAction(
  caseId: string,
  proposedId: string,
  formData: FormData,
): Promise<void> {
  const user = await guardUser();
  const edited = formData.get("content");
  const editedContent =
    typeof edited === "string" && edited.trim().length > 0 ? edited : undefined;
  await approveMemory(caseId, proposedId, user.id, editedContent);
  revalidatePath(`/cases/${caseId}/memory`);
  revalidatePath(`/cases/${caseId}/summary`);
  revalidatePath(`/cases/${caseId}`);
}

export async function rejectMemoryAction(
  caseId: string,
  proposedId: string,
): Promise<void> {
  const user = await guardUser();
  await reviewMemory(caseId, proposedId, user.id, "rejected");
  revalidatePath(`/cases/${caseId}/memory`);
}

export async function deferMemoryAction(
  caseId: string,
  proposedId: string,
): Promise<void> {
  const user = await guardUser();
  await reviewMemory(caseId, proposedId, user.id, "deferred");
  revalidatePath(`/cases/${caseId}/memory`);
}
