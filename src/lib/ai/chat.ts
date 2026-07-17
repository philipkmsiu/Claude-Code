import { getOpenAI, CHAT_MODEL } from "@/lib/ai/openai";
import {
  buildContext,
  reorderLostInTheMiddle,
  type RetrievedChunk,
} from "@/lib/retrieval";
import { getDocument } from "@/lib/repo";
import type {
  AiStructuredAnswer,
  Citation,
  StatementType,
  SuggestedMemoryUpdate,
} from "@/lib/types";

async function citationFor(
  caseId: string,
  rc: RetrievedChunk,
): Promise<Citation> {
  const doc = await getDocument(caseId, rc.chunk.documentId);
  return {
    documentId: rc.chunk.documentId,
    fileName: doc?.fileName ?? "unknown",
    page: rc.chunk.pageNumber,
    paragraph: rc.chunk.paragraphNumber,
    clause: rc.chunk.clauseNumber,
    quote: rc.chunk.text.slice(0, 300),
  };
}

const SYSTEM_PROMPT = `You are an assistant for Hong Kong construction arbitration and adjudication work.
You must be grounded strictly in the provided context. Follow these rules:
- Never invent facts, citations, clause wording or legal authorities.
- Only cite passages present in the context.
- Distinguish fact / allegation / inference / legal submission / expert opinion.
- Actively surface contrary or adverse evidence.
- Where documents conflict or context is thin, state the uncertainty.
Respond ONLY with a JSON object matching the requested schema.`;

function classify(text: string): StatementType {
  const t = text.toLowerCase();
  if (t.includes("i submit") || t.includes("submission")) return "legal_submission";
  if (t.includes("alleg")) return "allegation";
  if (t.includes("expert") || t.includes("opinion")) return "expert_opinion";
  if (t.includes("likely") || t.includes("appears") || t.includes("suggests"))
    return "inference";
  return "ai_generated";
}

// Deterministic, fully-offline grounded answer used when no OpenAI key is set.
async function localAnswer(
  caseId: string,
  query: string,
): Promise<AiStructuredAnswer> {
  const ctx = await buildContext(caseId, query);
  const top = ctx.chunks.slice(0, 5);
  const citations = await Promise.all(top.map((rc) => citationFor(caseId, rc)));
  const contraryChunks = ctx.chunks.filter((c) => c.contrary);
  const contraryEvidence = await Promise.all(
    contraryChunks.slice(0, 3).map(async (rc) => {
      const c = await citationFor(caseId, rc);
      return `${c.fileName} (p.${c.page ?? "?"}): ${c.quote}`;
    }),
  );

  const avgScore =
    top.length > 0 ? top.reduce((s, c) => s + c.score, 0) / top.length : 0;
  const confidence = Math.max(0.15, Math.min(0.9, avgScore));

  const answerParts: string[] = [];
  if (ctx.masterSummary) {
    answerParts.push(
      `Based on the approved Master Case Summary and retrieved source documents:`,
    );
  } else {
    answerParts.push(`Based on the retrieved source documents:`);
  }
  if (top.length === 0) {
    answerParts.push(
      `No source passages were retrieved for this query. I cannot answer without grounding, so this is flagged as unverified.`,
    );
  } else {
    top.slice(0, 3).forEach((rc, i) => {
      answerParts.push(
        `(${i + 1}) ${rc.chunk.text.slice(0, 220).trim()}${rc.chunk.text.length > 220 ? "…" : ""}`,
      );
    });
  }

  const uncertainties: string[] = [];
  if (contraryChunks.length > 0)
    uncertainties.push(
      "Contrary or adverse material was found; the position is disputed.",
    );
  if (top.length > 0 && avgScore < 0.3)
    uncertainties.push("Retrieval relevance is low; treat the answer with caution.");
  if (!ctx.masterSummary)
    uncertainties.push("No approved Master Case Summary exists yet for this case.");

  const suggestedMemoryUpdates: SuggestedMemoryUpdate[] = [];
  if (top.length > 0) {
    suggestedMemoryUpdates.push({
      target: "master_case_summary",
      action: "update",
      summary: `Record analysis of: ${query.slice(0, 60)}`,
      content: `Q: ${query}\nA: ${answerParts.slice(1).join(" ")}`.slice(0, 800),
    });
  }
  if (uncertainties.length > 0) {
    suggestedMemoryUpdates.push({
      target: "outstanding_questions",
      action: "add",
      summary: "Open question flagged during analysis",
      content: uncertainties.join(" "),
    });
  }

  const answer = answerParts.join("\n\n");
  return {
    answer,
    statementType: classify(answer),
    citations,
    memoryRecordsUsed: ctx.masterSummary ? ["master_case_summary"] : [],
    retrievedChunkIds: ctx.chunks.map((c) => c.chunk.id),
    uncertainties,
    contraryEvidence,
    suggestedMemoryUpdates,
    confidence,
    usedModel: "local-fallback",
    graphEntitiesUsed: ctx.graphEntities.map((e) => `${e.label} (${e.entityType})`),
  };
}

async function openAiAnswer(
  caseId: string,
  query: string,
): Promise<AiStructuredAnswer> {
  const openai = getOpenAI();
  if (!openai) return localAnswer(caseId, query);
  const ctx = await buildContext(caseId, query);
  // Reorder the bounded context to keep the most relevant passages at the edges
  // (lost-in-the-middle mitigation) before handing it to the model.
  const orderedChunks = reorderLostInTheMiddle(ctx.chunks);
  const contextBlocks = await Promise.all(
    orderedChunks.map(async (rc, i) => {
      const c = await citationFor(caseId, rc);
      return `[#${i + 1}] file=${c.fileName} page=${c.page ?? "?"} para=${c.paragraph ?? "?"} clause=${c.clause ?? "-"} contrary=${rc.contrary}\n${rc.chunk.text.slice(0, 700)}`;
    }),
  );

  const userPrompt = `CASE MASTER SUMMARY:\n${ctx.masterSummary ?? "(none approved yet)"}\n\nISSUES:\n${ctx.issues.map((i) => `- ${i.title} [${i.status}]`).join("\n") || "(none)"}\n\nRELATED ENTITIES (from knowledge graph):\n${ctx.graphEntities.map((e) => `- ${e.label} [${e.entityType}]`).join("\n") || "(none)"}\n\nRETRIEVED SOURCE PASSAGES:\n${contextBlocks.join("\n\n") || "(none)"}\n\nQUESTION: ${query}\n\nReturn JSON with keys: answer (string), statementType (one of fact|allegation|inference|legal_submission|expert_opinion|ai_generated|unverified), citations (array of {fileName,page,paragraph,clause,quote}), uncertainties (string[]), contraryEvidence (string[]), suggestedMemoryUpdates (array of {target,action,summary,content}), confidence (0..1).`;

  try {
    const res = await openai.chat.completions.create({
      model: CHAT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
    const parsed = JSON.parse(res.choices[0].message.content || "{}");
    return {
      answer: parsed.answer ?? "",
      statementType: parsed.statementType ?? "ai_generated",
      citations: parsed.citations ?? [],
      memoryRecordsUsed: ctx.masterSummary ? ["master_case_summary"] : [],
      retrievedChunkIds: ctx.chunks.map((c) => c.chunk.id),
      uncertainties: parsed.uncertainties ?? [],
      contraryEvidence: parsed.contraryEvidence ?? [],
      suggestedMemoryUpdates: parsed.suggestedMemoryUpdates ?? [],
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      usedModel: `openai:${CHAT_MODEL}`,
      graphEntitiesUsed: ctx.graphEntities.map((e) => `${e.label} (${e.entityType})`),
    };
  } catch {
    // Any API/parse failure falls back to the deterministic grounded answer.
    return localAnswer(caseId, query);
  }
}

export async function answerQuestion(
  caseId: string,
  query: string,
): Promise<AiStructuredAnswer> {
  return getOpenAI() ? openAiAnswer(caseId, query) : localAnswer(caseId, query);
}
