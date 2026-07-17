/**
 * Verify the Neo4j GraphStore adapter against a running Neo4j instance.
 *   NEO4J_URI=bolt://localhost:7687 NEO4J_USER=neo4j NEO4J_PASSWORD=... npm run verify:neo4j
 */
import { Neo4jGraphStore } from "@/lib/graph/neo4j";

async function main() {
  const store = new Neo4jGraphStore();
  const caseId = "case_neo4j_verify";

  const ok = await store.ping();
  console.log("ping:", ok);
  if (!ok) throw new Error("Neo4j not reachable");

  await store.indexEntities({
    caseId,
    chunkId: "chunk_A",
    documentId: "doc_1",
    entities: [
      { entityType: "party", label: "Apex Construction Co Ltd" },
      { entityType: "clause", label: "Clause 20.2" },
      { entityType: "date", label: "10 July 2024" },
    ],
  });
  await store.indexEntities({
    caseId,
    chunkId: "chunk_B",
    documentId: "doc_2",
    entities: [
      { entityType: "party", label: "Apex Construction Co Ltd" },
      { entityType: "amount", label: "HK$50,000" },
    ],
  });

  const entities = await store.entitiesInChunks(caseId, ["chunk_A"]);
  console.log("entitiesInChunks(chunk_A):", entities.length, "entities");

  // Expanding from chunk_A's entities should reach chunk_B (shared party).
  const chunks = await store.chunksForEntities(caseId, entities);
  console.log("chunksForEntities(...):", chunks.sort());
  const reachedB = chunks.includes("chunk_B");
  console.log("multi-hop reached chunk_B via shared party:", reachedB);

  const stats = await store.stats(caseId);
  console.log("stats:", stats);

  const graph = await store.getGraph(caseId);
  console.log("graph nodes:", graph.nodes.map((n) => `${n.label}[${n.entityType}]`).join(", "));
  console.log("graph co-occurrence edges:", graph.edges.length);

  if (!reachedB) throw new Error("Multi-hop expansion failed");
  console.log("\nNeo4j adapter OK.");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
