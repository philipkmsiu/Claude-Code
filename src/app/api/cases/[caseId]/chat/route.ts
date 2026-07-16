import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getCase,
  createChat,
  getChat,
  addMessage,
  addRetrievalLog,
  addProposedMemory,
  addAudit,
} from "@/lib/repo";
import { answerQuestion } from "@/lib/ai/chat";
import { newId, nowIso } from "@/lib/util";
import type { ChatMessage, ProposedMemoryUpdate } from "@/lib/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { caseId } = await params;
  const c = await getCase(caseId);
  if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const question = String(body.question || "").trim();
  if (!question) return NextResponse.json({ error: "Empty question" }, { status: 400 });

  let chatId = body.chatId as string | undefined;
  if (chatId) {
    const chat = await getChat(caseId, chatId);
    if (!chat) chatId = undefined;
  }
  if (!chatId) {
    const chat = await createChat(caseId, question.slice(0, 60));
    chatId = chat.id;
  }

  const userMsg: ChatMessage = {
    id: newId("msg"),
    chatId,
    caseId,
    role: "user",
    content: question,
    structured: null,
    createdAt: nowIso(),
  };
  await addMessage(userMsg);

  const answer = await answerQuestion(caseId, question);

  const assistantMsg: ChatMessage = {
    id: newId("msg"),
    chatId,
    caseId,
    role: "assistant",
    content: answer.answer,
    structured: answer,
    createdAt: nowIso(),
  };
  await addMessage(assistantMsg);

  await addRetrievalLog({
    id: newId("rlog"),
    caseId,
    chatId,
    query: question,
    retrievedChunkIds: answer.retrievedChunkIds,
    scores: [],
    createdAt: nowIso(),
  });

  // Persist AI-suggested memory updates as "proposed" — never auto-applied.
  for (const s of answer.suggestedMemoryUpdates) {
    const proposed: ProposedMemoryUpdate = {
      id: newId("pmu"),
      caseId,
      chatId,
      messageId: assistantMsg.id,
      target: s.target,
      action: s.action,
      summary: s.summary,
      content: s.content,
      status: "proposed",
      createdAt: nowIso(),
      reviewedBy: null,
      reviewedAt: null,
    };
    await addProposedMemory(proposed);
  }

  await addAudit(caseId, user.id, "chat.answer", `Answered: "${question.slice(0, 80)}"`);

  return NextResponse.json({ chatId, message: assistantMsg });
}
