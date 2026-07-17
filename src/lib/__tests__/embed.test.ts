import { describe, it, expect } from "vitest";
import { localEmbed, cosineSimilarity, LOCAL_EMBED_DIM } from "@/lib/ai/embed";

describe("local embeddings", () => {
  it("produces a fixed-dimension normalised vector", () => {
    const v = localEmbed("completion date liquidated damages");
    expect(v).toHaveLength(LOCAL_EMBED_DIM);
    const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    expect(mag).toBeCloseTo(1, 5);
  });

  it("scores similar text higher than unrelated text", () => {
    const q = localEmbed("non completion certificate validity clause 20.2");
    const near = localEmbed("the non completion certificate is invalid under clause 20.2");
    const far = localEmbed("rainfall weather report april showers");
    expect(cosineSimilarity(q, near)).toBeGreaterThan(cosineSimilarity(q, far));
  });
});
