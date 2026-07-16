import OpenAI from "openai";

// Server-side only. API keys must never reach client code (security rule).
export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
export const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

let client: OpenAI | null | undefined;

export function getOpenAI(): OpenAI | null {
  if (client !== undefined) return client;
  const key = process.env.OPENAI_API_KEY;
  client = key ? new OpenAI({ apiKey: key }) : null;
  return client;
}

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
