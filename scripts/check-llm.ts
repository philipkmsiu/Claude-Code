/**
 * Diagnose the currently-configured LLM provider (reads .env.local).
 *   npm run check:llm
 * Makes a tiny chat + embedding call and reports success/failure. Never prints
 * the API key.
 */
import { promises as fs } from "fs";
import path from "path";

async function loadEnvLocal() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith("#")) {
        const val = m[2].replace(/^["']|["']$/g, "");
        if (val && !process.env[m[1]]) process.env[m[1]] = val;
      }
    }
  } catch {
    // no .env.local
  }
}

async function main() {
  await loadEnvLocal();
  const { getOpenAI, CHAT_MODEL, EMBEDDING_MODEL, providerLabel, OPENAI_BASE_URL } =
    await import("@/lib/ai/openai");

  console.log("Provider:", providerLabel());
  console.log("Base URL:", OPENAI_BASE_URL ?? "(default: api.openai.com)");
  console.log("Chat model:", CHAT_MODEL);
  console.log("Embedding model:", EMBEDDING_MODEL);
  const client = getOpenAI();
  if (!client) {
    console.log("\nNo OPENAI_API_KEY set — app uses the local offline fallback.");
    return;
  }

  console.log("\n[1/2] Testing chat completion…");
  try {
    const res = await client.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: "user", content: "Reply with the single word: pong" }],
      max_tokens: 5,
    });
    console.log("  ✓ chat OK →", JSON.stringify(res.choices[0]?.message?.content));
  } catch (err) {
    console.log("  ✗ chat FAILED →", err instanceof Error ? err.message : String(err));
  }

  console.log("[2/2] Testing embeddings…");
  try {
    const res = await client.embeddings.create({ model: EMBEDDING_MODEL, input: "test" });
    console.log(`  ✓ embeddings OK → dim ${res.data[0].embedding.length}`);
  } catch (err) {
    console.log("  ✗ embeddings FAILED →", err instanceof Error ? err.message : String(err));
    console.log("    (If the provider has no /embeddings, the app auto-falls back to local vectors.)");
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
