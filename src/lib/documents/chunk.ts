import type { ExtractedPage } from "@/lib/documents/extract";

export interface RawChunk {
  parentIndex: number | null;
  isParent: boolean;
  pageNumber: number;
  paragraphNumber: number | null;
  clauseNumber: string | null;
  heading: string | null;
  text: string;
}

const CLAUSE_RE = /^\s*(\d+(?:\.\d+)*)[\s.)]/;
const HEADING_RE = /^([A-Z][A-Z0-9 ,&/'-]{4,})$/;

// Parent-child chunking: each page becomes a parent chunk (preserving
// surrounding context) and its paragraphs become child chunks (the precise,
// embeddable passages). Clause/heading/paragraph metadata is captured so
// citations can point at an exact location.
export function chunkPages(pages: ExtractedPage[]): RawChunk[] {
  const chunks: RawChunk[] = [];
  pages.forEach((page) => {
    const parentIndex = chunks.length;
    chunks.push({
      parentIndex: null,
      isParent: true,
      pageNumber: page.pageNumber,
      paragraphNumber: null,
      clauseNumber: null,
      heading: null,
      text: page.text,
    });

    const paragraphs = page.text
      .split(/\n{2,}|(?<=\.)\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    let currentHeading: string | null = null;
    paragraphs.forEach((para, i) => {
      const firstLine = para.split("\n")[0].trim();
      if (HEADING_RE.test(firstLine) && firstLine.length < 80) {
        currentHeading = firstLine;
      }
      const clauseMatch = para.match(CLAUSE_RE);
      chunks.push({
        parentIndex,
        isParent: false,
        pageNumber: page.pageNumber,
        paragraphNumber: i + 1,
        clauseNumber: clauseMatch ? clauseMatch[1] : null,
        heading: currentHeading,
        text: para,
      });
    });
  });
  return chunks;
}
