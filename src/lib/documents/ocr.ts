import { getOpenAI } from "@/lib/ai/openai";

// Vision-model OCR for scanned / image-only PDF pages. Uses the configured
// OpenAI-compatible provider (e.g. OpenAI, CrazyRouter) with a vision-capable
// model. Tuned for legal / construction-arbitration documents: verbatim,
// no correction or inference, and unreadable text is marked [illegible] so the
// model never hallucinates contract or clause wording.

export function visionModel(): string {
  return (
    process.env.OPENAI_VISION_MODEL ||
    process.env.OPENAI_CHAT_MODEL ||
    "gpt-4o-mini"
  );
}

// OCR is available when an API client is configured and not explicitly disabled.
export function ocrAvailable(): boolean {
  return process.env.OCR_ENABLED !== "false" && Boolean(getOpenAI());
}

// Page is treated as "no usable text layer" (candidate for OCR) below this.
export const OCR_MIN_CHARS = 40;

const OCR_SYSTEM_PROMPT = `You are a precise OCR transcription engine for legal and construction-arbitration documents.
Transcribe ALL text visible in the page image EXACTLY as written.
Rules:
- Transcribe verbatim. Do NOT summarise, translate, paraphrase, reorder, correct spelling, or infer missing words.
- Preserve reading order, headings, numbered clauses, lists, and tables (render tables as plain text rows).
- Preserve exact dates, monetary amounts, reference numbers, party names and clause numbers.
- If any text is unreadable or ambiguous, write [illegible] in its place rather than guessing. Accuracy is critical.
- Output ONLY the transcribed text, with no commentary.`;

export async function ocrImageDataUrl(dataUrl: string): Promise<string> {
  const client = getOpenAI();
  if (!client) return "";
  const maxTokens = Number(process.env.OCR_MAX_TOKENS || 4096);
  const res = await client.chat.completions.create({
    model: visionModel(),
    temperature: 0,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: OCR_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Transcribe this document page verbatim." },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}

// Render the requested PDF pages to images and OCR each. Returns a map of
// pageNumber -> transcribed text. Failures per page are swallowed so ingestion
// continues; the page simply keeps whatever text layer it had.
export async function ocrPdfPages(
  buf: Buffer,
  pageNumbers: number[],
): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  if (pageNumbers.length === 0 || !ocrAvailable()) return out;

  const { PDFParse } = await import("pdf-parse");
  const width = Number(process.env.OCR_IMAGE_WIDTH || 1600);
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    for (const n of pageNumbers) {
      try {
        const shot = await parser.getScreenshot({
          partial: [n],
          desiredWidth: width,
          imageDataUrl: true,
          imageBuffer: false,
        });
        const dataUrl = shot.pages[0]?.dataUrl;
        if (!dataUrl) continue;
        const text = await ocrImageDataUrl(dataUrl);
        if (text) out.set(n, text);
      } catch (err) {
        console.error(`OCR failed for page ${n}:`, err);
      }
    }
  } finally {
    await parser.destroy().catch(() => undefined);
  }
  return out;
}
