import OpenAI from "openai";

// Server-side only. API keys must never reach client code (security rule).
export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
export const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

// Optional custom base URL so any OpenAI-compatible provider/router
// (e.g. CrazyRouter, OpenRouter, a self-hosted gateway) can be used instead of
// api.openai.com. The provider must expose the OpenAI chat-completions API;
// embeddings additionally require the provider to support /embeddings (if not,
// embedding calls fail and the code falls back to local embeddings).
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || undefined;

let client: OpenAI | null | undefined;

export function getOpenAI(): OpenAI | null {
  if (client !== undefined) return client;
  const key = process.env.OPENAI_API_KEY;
  client = key ? new OpenAI({ apiKey: key, baseURL: OPENAI_BASE_URL }) : null;
  return client;
}

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

// Human-readable description of the active provider for the Settings screen.
export function providerLabel(): string {
  if (!process.env.OPENAI_API_KEY) return "local fallback";
  return OPENAI_BASE_URL ? `custom (${OPENAI_BASE_URL})` : "OpenAI (api.openai.com)";
}
