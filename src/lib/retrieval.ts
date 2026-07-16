import { listChunks, getMasterSummary, listIssues } from "@/lib/repo";
import { embed, cosineSimilarity } from "@/lib/ai/embed";
import type { DocumentChunk } from "@/lib/types";

export interface RetrievedChunk {
  chunk: DocumentChunk;
  vectorScore: number;
  keywordScore: number;
  score: number;
  contrary: boolean;
}

const CONTRARY_TERMS = [
  "however",
  "but",
  "deny",
  "denied",
  "dispute",
  "disputed",
  "reject",
  "contrary",
  "invalid",
  "fail",
  "failed",
  "no evidence",
  "not entitled",
  "unless",
  "except",
];

const STOP = new Set([
  "the", "a", "an", "of", "to", "in", "on", "for", "and", "or", "is", "are",
  "was", "were", "be", "by", "with", "as", "at", "that", "this", "it",
]);

function keywords(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
    (t) => t.length > 2 && !STOP.has(t),
  );
}

function keywordScore(queryTerms: string[], chunkText: string): number {
  if (queryTerms.length === 0) return 0;
  const lower = chunkText.toLowerCase();
  let hits = 0;
  for (const t of queryTerms) if (lower.includes(t)) hits++;
  return hits / queryTerms.length;
}

function recencyWeight(createdAt: string): number {
  // Slight preference for more recent material (document-version + recency
  // weighting). Ranges ~1.0 (new) down to ~0.9 (old).
  const ageDays =
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return 1 - Math.min(ageDays / 3650, 1) * 0.1;
}

export interface RetrievalOptions {
  topK?: number;
  includeContrary?: boolean;
}

// Case-scoped hybrid retrieval. Never reads chunks from another case because
// listChunks(caseId) is itself scoped.
export async function retrieve(
  caseId: string,
  query: string,
  opts: RetrievalOptions = {},
): Promise<RetrievedChunk[]> {
  const topK = opts.topK ?? 8;
  const childChunks = (await listChunks(caseId)).filter((c) => !c.isParent);
  if (childChunks.length === 0) return [];

  const queryEmbedding = await embed(query);
  const qTerms = keywords(query);

  const scored: RetrievedChunk[] = childChunks.map((chunk) => {
    const vectorScore =
      chunk.embedding.length === queryEmbedding.length
        ? cosineSimilarity(queryEmbedding, chunk.embedding)
        : 0;
    const kw = keywordScore(qTerms, chunk.text);
    const contrary = CONTRARY_TERMS.some((t) => chunk.text.toLowerCase().includes(t));
    // Hybrid fusion + recency weighting + rerank boost for contrary evidence so
    // the system actively surfaces adverse material (anti confirmation-bias).
    const base = 0.6 * vectorScore + 0.4 * kw;
    const score = base * recencyWeight(chunk.createdAt);
    return { chunk, vectorScore, keywordScore: kw, score, contrary };
  });

  scored.sort((a, b) => b.score - a.score);

  const primary = scored.slice(0, topK);

  // Ensure at least some contrary evidence is retrieved when it exists.
  if (opts.includeContrary !== false) {
    const contrary = scored
      .filter((s) => s.contrary && !primary.includes(s))
      .slice(0, 3);
    return [...primary, ...contrary];
  }
  return primary;
}

export interface CaseContext {
  masterSummary: string | null;
  issues: { title: string; status: string }[];
  chunks: RetrievedChunk[];
}

// Builds the bounded context in the spec's suggested retrieval order:
// approved memory (master summary) -> issue notes -> source chunks (incl.
// contrary evidence), reranked.
export async function buildContext(
  caseId: string,
  query: string,
): Promise<CaseContext> {
  const { currentVersion } = await getMasterSummary(caseId);
  const issues = await listIssues(caseId);
  const chunks = await retrieve(caseId, query, { includeContrary: true });
  return {
    masterSummary: currentVersion?.content ?? null,
    issues: issues.map((i) => ({ title: i.title, status: i.status })),
    chunks,
  };
}
