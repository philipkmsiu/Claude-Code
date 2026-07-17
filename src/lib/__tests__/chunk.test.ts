import { describe, it, expect } from "vitest";
import { chunkPages } from "@/lib/documents/chunk";

describe("parent-child chunking", () => {
  it("creates one parent per page plus child paragraphs", () => {
    const chunks = chunkPages([
      { pageNumber: 1, text: "12.1 The Completion Date shall be 30 June 2024.\n\nSecond paragraph here." },
    ]);
    const parents = chunks.filter((c) => c.isParent);
    const children = chunks.filter((c) => !c.isParent);
    expect(parents).toHaveLength(1);
    expect(children.length).toBeGreaterThanOrEqual(2);
    expect(children.every((c) => c.parentIndex === 0)).toBe(true);
  });

  it("detects clause numbers", () => {
    const chunks = chunkPages([
      { pageNumber: 1, text: "12.2 The Contractor shall be entitled to an extension." },
    ]);
    const child = chunks.find((c) => !c.isParent);
    expect(child?.clauseNumber).toBe("12.2");
  });

  it("carries page numbers through", () => {
    const chunks = chunkPages([
      { pageNumber: 1, text: "Alpha." },
      { pageNumber: 2, text: "Beta." },
    ]);
    expect(chunks.some((c) => c.pageNumber === 2)).toBe(true);
  });
});
