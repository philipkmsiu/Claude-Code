import { listChunks, getMasterSummary, listIssues } from "@/lib/repo";
import { embed, cosineSimilarity } from "@/lib/ai/embed";
import { getGraphStore } from "@/lib/graph/store";
import type { DocumentChunk, EntityType } from "@/lib/types";

export interface RetrievedChunk {
  chunk: DocumentChunk;
  vectorScore: number;
  keywordScore: number;
  score: number;
  contrary: boolean;
  graph?: boolean; // true if surfaced via knowledge-graph expansion
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

// "Lost in the middle" mitigation. LLMs attend most strongly to the start and
// end of a context and can miss information buried in the middle. Given items
// already sorted by descending relevance, this interleaves them so the most
// relevant land at the two edges and the least relevant sit in the middle,
// e.g. ranks [0,1,2,3,4,5] -> [0,2,4,5,3,1].
export function reorderLostInTheMiddle<T>(items: T[]): T[] {
  const head: T[] = [];
  const tail: T[] = [];
  items.forEach((it, i) => {
    if (i % 2 === 0) head.push(it);
    else tail.unshift(it);
  });
  return [...head, ...tail];
}

export interface CaseContext {
  masterSummary: string | null;
  issues: { title: string; status: string }[];
  chunks: RetrievedChunk[];
  graphEntities: { label: string; entityType: EntityType }[];
}

// Builds the bounded context in the spec's suggested retrieval order:
// approved memory (master summary) -> issue notes -> source chunks (incl.
// contrary evidence), reranked. It is then augmented with Graph RAG: entities
// mentioned in the top vector hits are expanded through the knowledge graph to
// pull in related passages that pure vector similarity might miss (multi-hop).
export async function buildContext(
  caseId: string,
  query: string,
): Promise<CaseContext> {
  const { currentVersion } = await getMasterSummary(caseId);
  const issues = await listIssues(caseId);
  const chunks = await retrieve(caseId, query, { includeContrary: true });

  let graphExpanded: RetrievedChunk[] = [];
  let graphEntities: { label: string; entityType: EntityType }[] = [];
  try {
    const graph = getGraphStore();
    const seedChunkIds = chunks.slice(0, 6).map((c) => c.chunk.id);
    const entityIds = await graph.entitiesInChunks(caseId, seedChunkIds);
    if (entityIds.length > 0) {
      const relatedChunkIds = await graph.chunksForEntities(caseId, entityIds);
      const have = new Set(chunks.map((c) => c.chunk.id));
      const newIds = relatedChunkIds.filter((id) => !have.has(id));
      if (newIds.length > 0) {
        const all = await listChunks(caseId);
        const byId = new Map(all.map((c) => [c.id, c]));
        graphExpanded = newIds
          .map((id) => byId.get(id))
          .filter((c): c is DocumentChunk => Boolean(c))
          .slice(0, 4)
          .map((chunk) => ({
            chunk,
            vectorScore: 0,
            keywordScore: 0,
            score: 0,
            contrary: false,
            graph: true,
          }));
      }
      const view = await graph.getGraph(caseId);
      const idSet = new Set(entityIds);
      graphEntities = view.nodes
        .filter((n) => idSet.has(n.id))
        .sort((a, b) => b.mentions - a.mentions)
        .slice(0, 12)
        .map((n) => ({ label: n.label, entityType: n.entityType }));
    }
  } catch (err) {
    console.error("Graph augmentation skipped:", err);
  }

  return {
    masterSummary: currentVersion?.content ?? null,
    issues: issues.map((i) => ({ title: i.title, status: i.status })),
    chunks: [...chunks, ...graphExpanded],
    graphEntities,
  };
}
