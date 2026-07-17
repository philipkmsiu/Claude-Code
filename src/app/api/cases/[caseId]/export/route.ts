import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCase, recordExport, addAudit } from "@/lib/repo";
import { exportCase, type ExportFormat } from "@/lib/export";
import { newId, nowIso } from "@/lib/util";

const VALID: ExportFormat[] = ["word", "excel", "markdown", "json"];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { caseId } = await params;
  const c = await getCase(caseId);
  if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const url = new URL(req.url);
  const format = (url.searchParams.get("format") || "word") as ExportFormat;
  if (!VALID.includes(format)) {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  const { buffer, contentType, fileName } = await exportCase(caseId, format);

  await recordExport({
    id: newId("exp"),
    caseId,
    format,
    kind: "case_report",
    createdBy: user.id,
    createdAt: nowIso(),
  });
  await addAudit(caseId, user.id, "export", `Exported ${format} report`);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
