import { describe, it, expect, beforeEach } from "vitest";
import { __resetStoreForTests } from "@/lib/db/store";
import {
  createCase,
  listChunks,
  getDocumentVersions,
  getDocument,
  listProposedMemory,
  approveMemory,
  getMasterSummary,
  addProposedMemory,
} from "@/lib/repo";
import { ingestDocument } from "@/lib/documents/ingest";
import { retrieve, buildContext } from "@/lib/retrieval";
import { answerQuestion } from "@/lib/ai/chat";
import { exportCase } from "@/lib/export";
import { newId, nowIso } from "@/lib/util";
import type { ProposedMemoryUpdate } from "@/lib/types";

async function makeCase(name: string) {
  return createCase({
    name,
    reference: name,
    claimant: "C",
    respondent: "R",
    tribunal: "HKIAC",
    description: "",
    createdBy: "user_test",
  });
}

beforeEach(async () => {
  await __resetStoreForTests();
});

describe("ingestion + retrieval", () => {
  it("ingests a document into pages and chunks and retrieves it", async () => {
    const c = await makeCase("case-a");
    const res = await ingestDocument({
      caseId: c.id,
      fileName: "Contract.txt",
      buffer: Buffer.from(
        "Clause 12.1 The Completion Date shall be 30 June 2024.\n\nClause 14.4 Liquidated damages of HK$50,000 per day.",
      ),
      userId: "user_test",
    });
    expect(res.pages).toBeGreaterThanOrEqual(1);
    expect(res.chunks).toBeGreaterThanOrEqual(1);

    const hits = await retrieve(c.id, "completion date");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].chunk.text.toLowerCase()).toContain("completion date");
  });

  it("detects duplicate content by hash", async () => {
    const c = await makeCase("case-dup");
    const buf = Buffer.from("Identical content for hashing.");
    await ingestDocument({ caseId: c.id, fileName: "a.txt", buffer: buf, userId: "u" });
    const second = await ingestDocument({ caseId: c.id, fileName: "b.txt", buffer: buf, userId: "u" });
    expect(second.duplicate).toBe(true);
  });
});

describe("cross-case isolation", () => {
  it("never retrieves chunks from another case", async () => {
    const a = await makeCase("case-a");
    const b = await makeCase("case-b");
    await ingestDocument({
      caseId: a.id,
      fileName: "secret.txt",
      buffer: Buffer.from("The asbestos contamination claim is worth HK$9,000,000."),
      userId: "u",
    });
    await ingestDocument({
      caseId: b.id,
      fileName: "other.txt",
      buffer: Buffer.from("Unrelated scaffolding dispute about delay."),
      userId: "u",
    });

    const bChunks = await listChunks(b.id);
    expect(bChunks.every((ch) => ch.caseId === b.id)).toBe(true);

    const leak = await retrieve(b.id, "asbestos contamination 9,000,000");
    expect(leak.every((r) => r.chunk.caseId === b.id)).toBe(true);
    expect(leak.some((r) => r.chunk.text.includes("asbestos"))).toBe(false);
  });
});

describe("document versioning / supersession", () => {
  it("links a superseding document and flags the prior one", async () => {
    const c = await makeCase("case-v");
    const first = await ingestDocument({
      caseId: c.id, fileName: "NCC_v1.txt",
      buffer: Buffer.from("Non-Completion Certificate version one."), userId: "u",
    });
    const second = await ingestDocument({
      caseId: c.id, fileName: "NCC_v2.txt",
      buffer: Buffer.from("Non-Completion Certificate version two, corrected."),
      userId: "u", supersedesDocumentId: first.document.id,
    });
    const prior = await getDocument(c.id, first.document.id);
    expect(prior?.supersededByDocumentId).toBe(second.document.id);
    const versions = await getDocumentVersions(c.id, second.document.id);
    expect(versions[0].versionNumber).toBe(1);
  });
});

describe("grounded chat + citations", () => {
  it("returns citations bound to ingested documents and surfaces contrary evidence", async () => {
    const c = await makeCase("case-chat");
    await ingestDocument({
      caseId: c.id, fileName: "Claim.txt",
      buffer: Buffer.from("The Claimant submits the Non-Completion Certificate is invalid under Clause 20.2."),
      userId: "u",
    });
    await ingestDocument({
      caseId: c.id, fileName: "Defence.txt",
      buffer: Buffer.from("The Respondent denies invalidity; however it accepts the certificate did not restate the date."),
      userId: "u",
    });

    const ans = await answerQuestion(c.id, "Is the Non-Completion Certificate valid?");
    expect(ans.citations.length).toBeGreaterThan(0);
    expect(ans.citations.every((ci) => ci.fileName && ci.fileName !== "unknown")).toBe(true);
    expect(ans.retrievedChunkIds.length).toBeGreaterThan(0);
    expect(ans.contraryEvidence.length).toBeGreaterThan(0); // "denies", "however"
    expect(ans.suggestedMemoryUpdates.length).toBeGreaterThan(0);
    expect(ans.usedModel).toBe("local-fallback");
  });

  it("flags unverified when there is nothing to ground on", async () => {
    const c = await makeCase("case-empty");
    const ans = await answerQuestion(c.id, "What are the damages?");
    expect(ans.citations).toHaveLength(0);
    expect(ans.uncertainties.length).toBeGreaterThan(0);
  });
});

describe("memory approval + versioning", () => {
  it("only applies approved memory and preserves version history", async () => {
    const c = await makeCase("case-mem");
    const proposed: ProposedMemoryUpdate = {
      id: newId("pmu"), caseId: c.id, chatId: null, messageId: null,
      target: "master_case_summary", action: "update",
      summary: "v1 summary", content: "First approved summary.",
      status: "proposed", createdAt: nowIso(), reviewedBy: null, reviewedAt: null,
    };
    await addProposedMemory(proposed);

    // Not applied until approved.
    let ms = await getMasterSummary(c.id);
    expect(ms.currentVersion).toBeNull();

    await approveMemory(c.id, proposed.id, "user_test");
    ms = await getMasterSummary(c.id);
    expect(ms.currentVersion?.content).toBe("First approved summary.");

    // A second approval creates a new version and preserves the first.
    const proposed2: ProposedMemoryUpdate = { ...proposed, id: newId("pmu"), content: "Second summary.", summary: "v2" };
    await addProposedMemory(proposed2);
    await approveMemory(c.id, proposed2.id, "user_test");
    ms = await getMasterSummary(c.id);
    expect(ms.currentVersion?.content).toBe("Second summary.");
    expect(ms.versions.length).toBe(2);

    const reviewed = (await listProposedMemory(c.id)).filter((p) => p.status === "approved");
    expect(reviewed.length).toBe(2);
  });
});

describe("exports", () => {
  it("produces markdown, json, excel and word buffers", async () => {
    const c = await makeCase("case-export");
    await ingestDocument({
      caseId: c.id, fileName: "Doc.txt",
      buffer: Buffer.from("Some content."), userId: "u",
    });
    const md = await exportCase(c.id, "markdown");
    expect(md.buffer.toString("utf8")).toContain("Case Report");
    const json = await exportCase(c.id, "json");
    expect(() => JSON.parse(json.buffer.toString("utf8"))).not.toThrow();
    const xlsx = await exportCase(c.id, "excel");
    expect(xlsx.buffer.byteLength).toBeGreaterThan(0);
    const word = await exportCase(c.id, "word");
    expect(word.buffer.byteLength).toBeGreaterThan(0);
  });
});

describe("context building order", () => {
  it("includes issues and retrieved chunks", async () => {
    const c = await makeCase("case-ctx");
    await ingestDocument({
      caseId: c.id, fileName: "Doc.txt",
      buffer: Buffer.from("Extension of time for adverse weather in April 2024."),
      userId: "u",
    });
    const ctx = await buildContext(c.id, "extension of time weather");
    expect(ctx.chunks.length).toBeGreaterThan(0);
  });
});
