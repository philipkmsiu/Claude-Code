import Link from "next/link";
import { notFound } from "next/navigation";
import { getIssue, getIssueVersions } from "@/lib/repo";

export default async function IssueDetail({
  params,
}: {
  params: Promise<{ caseId: string; issueId: string }>;
}) {
  const { caseId, issueId } = await params;
  const issue = await getIssue(caseId, issueId);
  if (!issue) notFound();
  const versions = await getIssueVersions(caseId, issueId);

  return (
    <div>
      <Link href={`/cases/${caseId}/issues`} className="text-[13px] text-[color:var(--muted)] hover:underline">
        ← Issues
      </Link>
      <div className="flex items-center gap-3 mt-2 mb-5">
        <h1 className="text-xl font-semibold">{issue.title}</h1>
        <span className={`badge ${issue.status === "resolved" ? "badge-resolved" : "badge-open"}`}>
          {issue.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <div className="label">Claimant position</div>
          <p className="text-[13px]">{issue.claimantPosition || "—"}</p>
        </div>
        <div className="card p-5">
          <div className="label">Respondent position</div>
          <p className="text-[13px]">{issue.respondentPosition || "—"}</p>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Analysis history</h2>
        {versions.length === 0 ? (
          <p className="text-[13px] text-[color:var(--muted)]">
            No analysis versions yet. Approved AI analysis for this issue is recorded here with full version history.
          </p>
        ) : (
          <div className="space-y-4">
            {versions.map((v) => (
              <div key={v.id}>
                <div className="label">v{v.versionNumber} · {new Date(v.createdAt).toLocaleString()}</div>
                <p className="text-[13px] whitespace-pre-wrap">{v.analysis}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
