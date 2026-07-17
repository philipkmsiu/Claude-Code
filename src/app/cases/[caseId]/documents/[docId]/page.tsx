import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDocument,
  getDocumentVersions,
  getDocumentPages,
} from "@/lib/repo";

export default async function DocumentDetail({
  params,
}: {
  params: Promise<{ caseId: string; docId: string }>;
}) {
  const { caseId, docId } = await params;
  const doc = await getDocument(caseId, docId);
  if (!doc) notFound();
  const [versions, pages] = await Promise.all([
    getDocumentVersions(caseId, docId),
    getDocumentPages(caseId, docId),
  ]);

  // Heuristic: flag likely scanned / image-only PDFs that have no real text
  // layer, so the user knows OCR is required to make them searchable.
  const currentVersion = versions.find((v) => v.id === doc.currentVersionId) ?? versions[0];
  const totalChars = pages.reduce((s, p) => s + p.text.trim().length, 0);
  const avgCharsPerPage = pages.length ? totalChars / pages.length : 0;
  const confidence = currentVersion?.extractionConfidence ?? 1;
  const isPdf = doc.fileName.toLowerCase().endsWith(".pdf");
  const likelyNeedsOcr = isPdf && (confidence < 0.6 || avgCharsPerPage < 50);

  return (
    <div>
      <Link href={`/cases/${caseId}/documents`} className="text-[13px] text-[color:var(--muted)] hover:underline">
        ← Documents
      </Link>
      <div className="flex items-center gap-3 mt-2 mb-4">
        <h1 className="text-xl font-semibold">{doc.fileName}</h1>
        <span className="badge">{doc.sourceType.replace(/_/g, " ")}</span>
        {doc.supersededByDocumentId && <span className="badge badge-disputed">Superseded</span>}
        {likelyNeedsOcr && <span className="badge badge-disputed">Needs OCR</span>}
      </div>

      {likelyNeedsOcr && (
        <div className="banner-warning mb-4">
          This PDF appears to be <strong>scanned / image-only</strong> (very little
          extractable text: {Math.round(avgCharsPerPage)} chars/page, extraction
          confidence {Math.round(confidence * 100)}%). It has no usable text layer, so
          retrieval and AI answers cannot see its content until it is OCR&apos;d. Re-save
          it with a searchable text layer, or enable an OCR pipeline (see notes).
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Metadata</h2>
          <dl className="text-[13px] space-y-2">
            <div className="flex justify-between"><dt className="text-[color:var(--muted)]">Document date</dt><dd>{doc.documentDate ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-[color:var(--muted)]">Upload date</dt><dd>{new Date(doc.uploadDate).toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt className="text-[color:var(--muted)]">Pages</dt><dd>{pages.length}</dd></div>
          </dl>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Versions</h2>
          <table className="data">
            <thead>
              <tr><th>Ver</th><th>Confidence</th><th>Hash</th></tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id}>
                  <td><span className="badge badge-version">v{v.versionNumber}</span></td>
                  <td>{Math.round(v.extractionConfidence * 100)}%</td>
                  <td className="font-mono text-[11px] text-[color:var(--muted)]">{v.hash.slice(0, 16)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5 mt-6">
        <h2 className="font-semibold mb-3">Extracted text (page-aware)</h2>
        <div className="space-y-4 max-h-[560px] overflow-auto">
          {pages.map((p) => (
            <div key={p.id}>
              <div className="label">Page {p.pageNumber}</div>
              <pre className="whitespace-pre-wrap text-[12px] text-[color:var(--foreground)] font-sans">
                {p.text || "(no extractable text)"}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
