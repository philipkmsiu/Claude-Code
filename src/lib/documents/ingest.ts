import { mutate } from "@/lib/db/store";
import { newId, nowIso, sha256 } from "@/lib/util";
import { extractDocument, sourceTypeFromName } from "@/lib/documents/extract";
import { chunkPages } from "@/lib/documents/chunk";
import { embedMany } from "@/lib/ai/embed";
import type {
  DocumentChunk,
  DocumentPage,
  DocumentRecord,
  DocumentVersion,
  SourceType,
} from "@/lib/types";

export interface IngestInput {
  caseId: string;
  fileName: string;
  title?: string;
  documentDate?: string | null;
  sourceType?: SourceType;
  buffer: Buffer;
  userId: string;
  supersedesDocumentId?: string | null;
}

export interface IngestResult {
  document: DocumentRecord;
  version: DocumentVersion;
  pages: number;
  chunks: number;
  duplicate: boolean;
}

export async function ingestDocument(input: IngestInput): Promise<IngestResult> {
  const hash = sha256(input.buffer);
  const extraction = await extractDocument(input.fileName, input.buffer);
  const rawChunks = chunkPages(extraction.pages);

  // Only child chunks are embedded (they are the retrieval unit).
  const childTexts = rawChunks.filter((c) => !c.isParent).map((c) => c.text);
  const childEmbeddings = await embedMany(childTexts);

  return mutate((db) => {
    // Duplicate detection across the case (never across cases).
    const existingVersion = db.document_versions.find(
      (v) => v.caseId === input.caseId && v.hash === hash,
    );
    const supersedes = input.supersedesDocumentId ?? null;
    const versionNumber = 1;

    const document: DocumentRecord = {
      id: newId("doc"),
      caseId: input.caseId,
      fileName: input.fileName,
      title: input.title || input.fileName,
      sourceType: input.sourceType || sourceTypeFromName(input.fileName),
      documentDate: input.documentDate ?? null,
      uploadDate: nowIso(),
      currentVersionId: "",
      supersededByDocumentId: null,
      createdBy: input.userId,
      createdAt: nowIso(),
    };
    db.documents.push(document);

    // Mark the superseded document as superseded by this new one.
    if (supersedes) {
      const prior = db.documents.find(
        (d) => d.id === supersedes && d.caseId === input.caseId,
      );
      if (prior) prior.supersededByDocumentId = document.id;
    }

    const version: DocumentVersion = {
      id: newId("ver"),
      documentId: document.id,
      caseId: input.caseId,
      versionNumber,
      fileName: input.fileName,
      hash,
      byteLength: input.buffer.byteLength,
      extractionConfidence: extraction.confidence,
      createdAt: nowIso(),
    };
    db.document_versions.push(version);
    document.currentVersionId = version.id;

    extraction.pages.forEach((p) => {
      const page: DocumentPage = {
        id: newId("pg"),
        documentId: document.id,
        versionId: version.id,
        caseId: input.caseId,
        pageNumber: p.pageNumber,
        text: p.text,
      };
      db.document_pages.push(page);
    });

    // Persist parent chunks first so children can reference their id.
    const parentIds: Record<number, string> = {};
    rawChunks.forEach((rc, idx) => {
      if (!rc.isParent) return;
      const id = newId("ck");
      parentIds[idx] = id;
      const chunk: DocumentChunk = {
        id,
        documentId: document.id,
        versionId: version.id,
        caseId: input.caseId,
        parentId: null,
        isParent: true,
        pageNumber: rc.pageNumber,
        paragraphNumber: null,
        clauseNumber: null,
        heading: null,
        sourceType: document.sourceType,
        text: rc.text,
        embedding: [],
        createdAt: nowIso(),
      };
      db.document_chunks.push(chunk);
    });

    let childCursor = 0;
    rawChunks.forEach((rc) => {
      if (rc.isParent) return;
      const chunk: DocumentChunk = {
        id: newId("ck"),
        documentId: document.id,
        versionId: version.id,
        caseId: input.caseId,
        parentId: rc.parentIndex !== null ? parentIds[rc.parentIndex] : null,
        isParent: false,
        pageNumber: rc.pageNumber,
        paragraphNumber: rc.paragraphNumber,
        clauseNumber: rc.clauseNumber,
        heading: rc.heading,
        sourceType: document.sourceType,
        text: rc.text,
        embedding: childEmbeddings[childCursor] ?? [],
        createdAt: nowIso(),
      };
      childCursor++;
      db.document_chunks.push(chunk);
    });

    db.audit_logs.push({
      id: newId("audit"),
      caseId: input.caseId,
      userId: input.userId,
      action: "document.ingest",
      detail: `Ingested "${document.fileName}" (${extraction.pages.length} pages, ${childTexts.length} chunks)${existingVersion ? " [duplicate hash]" : ""}`,
      createdAt: nowIso(),
    });

    return {
      document,
      version,
      pages: extraction.pages.length,
      chunks: childTexts.length,
      duplicate: Boolean(existingVersion),
    };
  });
}
