import Link from "next/link";
import { listIssues } from "@/lib/repo";
import { createIssueAction } from "@/app/actions/cases";

export default async function IssuesPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const issues = await listIssues(caseId);
  const action = createIssueAction.bind(null, caseId);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-5">Issues Register</h1>

      <details className="card p-5 mb-6">
        <summary className="cursor-pointer font-medium text-[13px]">+ Add issue</summary>
        <form action={action} className="space-y-4 mt-4">
          <div>
            <label className="label" htmlFor="title">Issue title</label>
            <input id="title" name="title" className="input" required placeholder="Validity of Non-Completion Certificate" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="claimantPosition">Claimant position</label>
              <textarea id="claimantPosition" name="claimantPosition" className="textarea" rows={2} />
            </div>
            <div>
              <label className="label" htmlFor="respondentPosition">Respondent position</label>
              <textarea id="respondentPosition" name="respondentPosition" className="textarea" rows={2} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Add issue</button>
        </form>
      </details>

      {issues.length === 0 ? (
        <div className="card p-8 text-center text-[color:var(--muted)]">No issues yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data">
            <thead>
              <tr><th>Issue</th><th>Status</th><th>Claimant</th><th>Respondent</th></tr>
            </thead>
            <tbody>
              {issues.map((i) => (
                <tr key={i.id}>
                  <td>
                    <Link href={`/cases/${caseId}/issues/${i.id}`} className="font-medium text-[color:var(--primary)] hover:underline">
                      {i.title}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge ${i.status === "resolved" ? "badge-resolved" : "badge-open"}`}>
                      {i.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="text-[color:var(--muted)]">{i.claimantPosition || "—"}</td>
                  <td className="text-[color:var(--muted)]">{i.respondentPosition || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
