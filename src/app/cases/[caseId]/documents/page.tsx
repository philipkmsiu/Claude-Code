import Link from "next/link";
import UploadForm from "@/components/UploadForm";
import { listDocuments } from "@/lib/repo";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const docs = await listDocuments(caseId);
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">Documents</h1>
        <a
          href={`/api/cases/${caseId}/export?format=excel`}
          className="btn btn-secondary"
        >
          Export index (Excel)
        </a>
      </div>

      <div className="mb-6">
        <UploadForm caseId={caseId} />
      </div>

      {docs.length === 0 ? (
        <div className="card p-8 text-center text-[color:var(--muted)]">
          No documents ingested yet.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data">
            <thead>
              <tr>
                <th>File</th>
                <th>Type</th>
                <th>Doc date</th>
                <th>Uploaded</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link
                      href={`/cases/${caseId}/documents/${d.id}`}
                      className="font-medium text-[color:var(--primary)] hover:underline"
                    >
                      {d.fileName}
                    </Link>
                  </td>
                  <td>{d.sourceType.replace(/_/g, " ")}</td>
                  <td>{d.documentDate ?? "—"}</td>
                  <td className="text-[color:var(--muted)]">
                    {new Date(d.uploadDate).toLocaleDateString()}
                  </td>
                  <td>
                    {d.supersededByDocumentId ? (
                      <span className="badge badge-disputed">Superseded</span>
                    ) : (
                      <span className="badge badge-resolved">Operative</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
