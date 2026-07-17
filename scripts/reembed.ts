/**
 * Re-embed all document chunks using the currently-configured embedding
 * provider. Run this after enabling OpenAI so previously-ingested documents
 * (embedded with the local fallback) switch to real semantic vectors:
 *
 *   OPENAI_API_KEY=sk-... npm run reembed
 *
 * Without OPENAI_API_KEY it re-embeds with the local fallback (a no-op change
 * in practice, but useful for verification).
 */
import { getDb, mutate } from "@/lib/db/store";
import { embedMany, embeddingMode } from "@/lib/ai/embed";

const BATCH = 64;

async function main() {
  const db = await getDb();
  const children = db.document_chunks.filter((c) => !c.isParent);
  console.log(`Embedding provider: ${embeddingMode()}`);
  console.log(`Re-embedding ${children.length} child chunk(s)…`);

  for (let i = 0; i < children.length; i += BATCH) {
    const batch = children.slice(i, i + BATCH);
    const vectors = await embedMany(batch.map((c) => c.text));
    await mutate((d) => {
      batch.forEach((chunk, j) => {
        const target = d.document_chunks.find((c) => c.id === chunk.id);
        if (target) target.embedding = vectors[j];
      });
    });
    console.log(`  …${Math.min(i + BATCH, children.length)}/${children.length}`);
  }

  console.log("Done. Restart the dev server so it reloads the updated store.");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
