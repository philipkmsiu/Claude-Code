import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCase } from "@/lib/repo";
import { ingestDocument } from "@/lib/documents/ingest";
import type { SourceType } from "@/lib/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { caseId } = await params;
  const c = await getCase(caseId);
  if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  const documentDate = form.get("documentDate");
  const sourceType = form.get("sourceType");
  const supersedes = form.get("supersedesDocumentId");

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const result = await ingestDocument({
      caseId,
      fileName: file.name,
      buffer,
      userId: user.id,
      documentDate: documentDate ? String(documentDate) : null,
      sourceType: sourceType ? (String(sourceType) as SourceType) : undefined,
      supersedesDocumentId: supersedes ? String(supersedes) : null,
    });
    return NextResponse.json({
      ok: true,
      documentId: result.document.id,
      pages: result.pages,
      chunks: result.chunks,
      duplicate: result.duplicate,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ingestion failed" },
      { status: 500 },
    );
  }
}
