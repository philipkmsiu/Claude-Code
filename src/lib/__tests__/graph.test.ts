import { describe, it, expect, beforeEach } from "vitest";
import { __resetStoreForTests } from "@/lib/db/store";
import { extractEntities } from "@/lib/graph/extract";
import { getGraphStore } from "@/lib/graph/store";
import { createCase, listChunks } from "@/lib/repo";
import { ingestDocument } from "@/lib/documents/ingest";
import { buildContext, reorderLostInTheMiddle } from "@/lib/retrieval";

beforeEach(async () => {
  await __resetStoreForTests();
});

describe("entity extraction", () => {
  it("extracts clauses, dates, amounts, orgs and parties", () => {
    const text =
      "Under Clause 20.2 the Non-Completion Certificate dated 10 July 2024 was issued by Apex Construction Co Ltd claiming HK$50,000 per day.";
    const ents = extractEntities(text, { claimant: "GreenHarbour Residential Ltd", respondent: "Apex Construction Co Ltd" });
    const byType = (t: string) => ents.filter((e) => e.entityType === t).map((e) => e.label);
    expect(byType("clause")).toContain("Clause 20.2");
    expect(byType("date")).toContain("10 July 2024");
    expect(byType("amount").some((a) => a.includes("50,000"))).toBe(true);
    expect(ents.some((e) => e.label.includes("Apex Construction"))).toBe(true);
  });
});

describe("lost-in-the-middle reorder", () => {
  it("places most relevant at the edges", () => {
    const out = reorderLostInTheMiddle([0, 1, 2, 3, 4, 5]);
    expect(out[0]).toBe(0); // best at front
    expect(out[out.length - 1]).toBe(1); // second best at end
    expect(out).toEqual([0, 2, 4, 5, 3, 1]);
  });
});

describe("local graph store", () => {
  it("indexes entities and expands multi-hop via shared entity", async () => {
    const store = getGraphStore();
    const caseId = "case_g1";
    await store.indexEntities({
      caseId, chunkId: "cA", documentId: "d1",
      entities: [
        { entityType: "organisation", label: "Apex Construction Co Ltd" },
        { entityType: "clause", label: "Clause 20.2" },
      ],
    });
    await store.indexEntities({
      caseId, chunkId: "cB", documentId: "d2",
      entities: [
        { entityType: "organisation", label: "Apex Construction Co Ltd" },
        { entityType: "amount", label: "HK$50,000" },
      ],
    });

    const ents = await store.entitiesInChunks(caseId, ["cA"]);
    const chunks = await store.chunksForEntities(caseId, ents);
    expect(chunks.sort()).toEqual(["cA", "cB"]); // reached cB via shared org

    const stats = await store.stats(caseId);
    expect(stats.nodes).toBe(3);
  });

  it("keeps graphs isolated between cases", async () => {
    const store = getGraphStore();
    await store.indexEntities({
      caseId: "caseX", chunkId: "x1", documentId: "d",
      entities: [{ entityType: "organisation", label: "Secret Corp Ltd" }],
    });
    await store.indexEntities({
      caseId: "caseY", chunkId: "y1", documentId: "d",
      entities: [{ entityType: "organisation", label: "Other Co Ltd" }],
    });
    const yGraph = await store.getGraph("caseY");
    expect(yGraph.nodes.every((n) => n.caseId === "caseY")).toBe(true);
    expect(yGraph.nodes.some((n) => n.label.includes("Secret"))).toBe(false);
    // entity from X must not be reachable from Y chunks
    const yEnts = await store.entitiesInChunks("caseY", ["x1"]);
    expect(yEnts).toHaveLength(0);
  });
});

describe("graph-augmented retrieval", () => {
  it("expands context to related passages via shared entities", async () => {
    const c = await createCase({
      name: "graph-rag", reference: "", claimant: "", respondent: "",
      tribunal: "", description: "", createdBy: "u",
    });
    const cert = await ingestDocument({
      caseId: c.id, fileName: "cert.txt",
      buffer: Buffer.from("The Non-Completion Certificate under Clause 20.2 was issued by Apex Construction Co Ltd."),
      userId: "u",
    });
    const counter = await ingestDocument({
      caseId: c.id, fileName: "counterclaim.txt",
      buffer: Buffer.from("Apex Construction Co Ltd counterclaims HK$50,000 per day of delay."),
      userId: "u",
    });

    // The knowledge graph links both documents via the shared organisation, so
    // expanding from the certificate passage reaches the counterclaim passage.
    const chunks = await listChunks(c.id);
    const certChunk = chunks.find((ch) => ch.documentId === cert.document.id && !ch.isParent)!;
    const counterChunk = chunks.find((ch) => ch.documentId === counter.document.id && !ch.isParent)!;

    const store = getGraphStore();
    const ents = await store.entitiesInChunks(c.id, [certChunk.id]);
    const reached = await store.chunksForEntities(c.id, ents);
    expect(reached).toContain(counterChunk.id);

    // Graph entities are surfaced in the built context.
    const ctx = await buildContext(c.id, "certificate validity clause");
    expect(ctx.graphEntities.some((e) => e.label.includes("Apex Construction"))).toBe(true);
  });
});
