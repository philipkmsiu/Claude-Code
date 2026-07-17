import { getMasterSummary } from "@/lib/repo";

export default async function SummaryPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const { currentVersion, versions } = await getMasterSummary(caseId);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">Master Case Summary</h1>
        <div className="flex gap-2">
          <a href={`/api/cases/${caseId}/export?format=word`} className="btn btn-secondary">Word</a>
          <a href={`/api/cases/${caseId}/export?format=markdown`} className="btn btn-secondary">Markdown</a>
          <a href={`/api/cases/${caseId}/export?format=json`} className="btn btn-secondary">JSON</a>
        </div>
      </div>

      <div className="card p-6 mb-6">
        {currentVersion ? (
          <>
            <div className="label">Current · v{currentVersion.versionNumber} · {new Date(currentVersion.createdAt).toLocaleString()}</div>
            <p className="text-[14px] whitespace-pre-wrap leading-relaxed">{currentVersion.content}</p>
          </>
        ) : (
          <p className="text-[13px] text-[color:var(--muted)]">
            No approved summary yet. The AI proposes summary updates after each analysis; approve them in Memory Review to build this living summary.
          </p>
        )}
      </div>

      {versions.length > 1 && (
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Version history</h2>
          <div className="space-y-4">
            {versions.map((v) => (
              <div key={v.id} className="border-l-2 pl-3" style={{ borderColor: "var(--border)" }}>
                <div className="label">v{v.versionNumber} · {new Date(v.createdAt).toLocaleString()}</div>
                <p className="text-[12px] whitespace-pre-wrap text-[color:var(--muted)]">
                  {v.content.slice(0, 300)}{v.content.length > 300 ? "…" : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
