import crypto from "crypto";
import { getOpenAI, EMBEDDING_MODEL } from "@/lib/ai/openai";

// Embedding dimensionality for the local deterministic fallback. OpenAI
// embeddings are reduced/compared independently, so this only needs to be
// consistent within the local mode.
export const LOCAL_EMBED_DIM = 256;

const TOKEN_RE = /[a-z0-9]+/g;

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(TOKEN_RE) ?? []).filter((t) => t.length > 1);
}

// Deterministic hashing embedding used when no OpenAI key is configured. It is
// a normalised bag-of-hashed-tokens vector: good enough for keyword-like
// semantic proximity in local development, and fully offline.
export function localEmbed(text: string): number[] {
  const vec = new Array<number>(LOCAL_EMBED_DIM).fill(0);
  for (const tok of tokenize(text)) {
    const h = crypto.createHash("md5").update(tok).digest();
    const idx = h.readUInt32BE(0) % LOCAL_EMBED_DIM;
    const sign = (h[4] & 1) === 0 ? 1 : -1;
    vec[idx] += sign;
  }
  return normalise(vec);
}

export function normalise(vec: number[]): number[] {
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (mag === 0) return vec;
  return vec.map((v) => v / mag);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // vectors are pre-normalised
}

export async function embed(text: string): Promise<number[]> {
  const openai = getOpenAI();
  if (!openai) return localEmbed(text);
  try {
    const res = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000),
    });
    return normalise(res.data[0].embedding as number[]);
  } catch {
    // Fall back gracefully so ingestion never hard-fails on API problems.
    return localEmbed(text);
  }
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  const openai = getOpenAI();
  if (!openai) return texts.map((t) => localEmbed(t));
  try {
    const res = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts.map((t) => t.slice(0, 8000)),
    });
    return res.data.map((d) => normalise(d.embedding as number[]));
  } catch {
    return texts.map((t) => localEmbed(t));
  }
}

export function embeddingMode(): "openai" | "local-fallback" {
  return getOpenAI() ? "openai" : "local-fallback";
}
