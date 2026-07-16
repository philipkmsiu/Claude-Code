import mammoth from "mammoth";
import * as XLSX from "xlsx";
import type { SourceType } from "@/lib/types";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractionResult {
  pages: ExtractedPage[];
  confidence: number; // 0..1 heuristic
}

// PDF extraction uses pdf-parse v2 (class-based, backed by pdfjs-dist). We read
// text per page for page-aware storage instead of one flat blob.
async function extractPdf(buf: Buffer): Promise<ExtractionResult> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    const result = await parser.getText();
    const pages: ExtractedPage[] =
      result.pages.length > 0
        ? result.pages.map((p) => ({ pageNumber: p.num, text: p.text ?? "" }))
        : splitIntoPages(result.text ?? "");
    const nonEmpty = pages.filter((p) => p.text.trim().length > 0).length;
    const confidence = pages.length ? nonEmpty / pages.length : 0;
    return { pages, confidence };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function extractDocx(buf: Buffer): Promise<ExtractionResult> {
  const res = await mammoth.extractRawText({ buffer: buf });
  return { pages: splitIntoPages(res.value), confidence: res.value ? 0.95 : 0 };
}

function extractXlsx(buf: Buffer): ExtractionResult {
  const wb = XLSX.read(buf, { type: "buffer" });
  const pages: ExtractedPage[] = wb.SheetNames.map((name, i) => {
    const sheet = wb.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return { pageNumber: i + 1, text: `[Sheet: ${name}]\n${csv}` };
  });
  return { pages, confidence: pages.length ? 0.9 : 0 };
}

function extractText(buf: Buffer): ExtractionResult {
  return { pages: splitIntoPages(buf.toString("utf8")), confidence: 1 };
}

// Deterministic pagination for formats without native pages: ~3500 chars/page,
// split on paragraph boundaries so we do not cut mid-sentence.
export function splitIntoPages(text: string, perPage = 3500): ExtractedPage[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [{ pageNumber: 1, text: "" }];
  const paras = clean.split(/\n{2,}/);
  const pages: ExtractedPage[] = [];
  let current = "";
  for (const para of paras) {
    if (current.length + para.length > perPage && current) {
      pages.push({ pageNumber: pages.length + 1, text: current.trim() });
      current = "";
    }
    current += (current ? "\n\n" : "") + para;
  }
  if (current.trim()) pages.push({ pageNumber: pages.length + 1, text: current.trim() });
  return pages;
}

export function sourceTypeFromName(fileName: string): SourceType {
  const n = fileName.toLowerCase();
  if (n.includes("contract")) return "contract";
  if (n.includes("pleading") || n.includes("opening") || n.includes("d&cc"))
    return "pleading";
  if (n.includes("letter") || n.includes("email") || n.includes("cnc"))
    return "correspondence";
  if (n.includes("witness") || n.includes("statement")) return "witness_statement";
  if (n.includes("expert") || n.includes("report")) return "expert_report";
  if (n.includes("authority") || n.includes("hkcfa") || n.includes("case"))
    return "authority";
  if (n.includes("drawing") || n.includes("plan")) return "drawing";
  if (n.includes("certificate") || n.includes("cert")) return "certificate";
  return "other";
}

export async function extractDocument(
  fileName: string,
  buf: Buffer,
): Promise<ExtractionResult> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return extractPdf(buf);
  if (lower.endsWith(".docx")) return extractDocx(buf);
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return extractXlsx(buf);
  // .txt, .md, .csv and unknown -> treat as UTF-8 text.
  return extractText(buf);
}
