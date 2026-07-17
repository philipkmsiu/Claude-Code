import { describe, it, expect, afterEach } from "vitest";
import { visionModel, ocrAvailable, OCR_MIN_CHARS } from "@/lib/documents/ocr";

const saved = { ...process.env };
afterEach(() => {
  process.env = { ...saved };
});

describe("OCR configuration", () => {
  it("is disabled without an API key", () => {
    delete process.env.OPENAI_API_KEY;
    expect(ocrAvailable()).toBe(false);
  });

  it("respects OCR_ENABLED=false without touching the client", () => {
    process.env.OCR_ENABLED = "false";
    process.env.OPENAI_API_KEY = "sk-test";
    expect(ocrAvailable()).toBe(false);
  });

  it("resolves the vision model from env with sensible fallbacks", () => {
    delete process.env.OPENAI_VISION_MODEL;
    delete process.env.OPENAI_CHAT_MODEL;
    expect(visionModel()).toBe("gpt-4o-mini");
    process.env.OPENAI_CHAT_MODEL = "chat-x";
    expect(visionModel()).toBe("chat-x");
    process.env.OPENAI_VISION_MODEL = "vision-y";
    expect(visionModel()).toBe("vision-y");
  });

  it("exposes a positive OCR text threshold", () => {
    expect(OCR_MIN_CHARS).toBeGreaterThan(0);
  });
});
