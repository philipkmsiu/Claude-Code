import { listProposedMemory } from "@/lib/repo";
import {
  approveMemoryAction,
  rejectMemoryAction,
  deferMemoryAction,
} from "@/app/actions/memory";

const TARGET_LABELS: Record<string, string> = {
  master_case_summary: "Master Case Summary",
  chronology: "Chronology",
  issues_register: "Issues Register",
  parties_positions: "Parties' Positions",
  evidence_register: "Evidence Register",
  authorities_register: "Authorities Register",
  witness_records: "Witness Records",
  outstanding_questions: "Outstanding Questions",
  task_list: "Task List",
};

export default async function MemoryReviewPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const all = await listProposedMemory(caseId);
  const pending = all.filter((p) => p.status === "proposed");
  const reviewed = all.filter((p) => p.status !== "proposed");

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Memory Review</h1>
      <p className="text-[13px] text-[color:var(--muted)] mb-5">
        The AI never silently rewrites approved case memory. Every material change requires your explicit approval and is recorded in the audit trail.
      </p>

      {pending.length === 0 ? (
        <div className="card p-8 text-center text-[color:var(--muted)]">
          No memory updates awaiting review.
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge badge-version">{TARGET_LABELS[p.target] ?? p.target}</span>
                <span className="type-tag">{p.action}</span>
                <span className="text-[12px] text-[color:var(--muted)]">
                  {new Date(p.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="label">Proposed change</div>
              <p className="text-[13px] font-medium mb-2">{p.summary}</p>
              <form action={approveMemoryAction.bind(null, caseId, p.id)} className="space-y-3">
                <textarea name="content" className="textarea" rows={4} defaultValue={p.content} />
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Approve</button>
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    formAction={deferMemoryAction.bind(null, caseId, p.id)}
                  >
                    Defer
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    formAction={rejectMemoryAction.bind(null, caseId, p.id)}
                  >
                    Reject
                  </button>
                </div>
              </form>
            </div>
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold mb-3">Reviewed</h2>
          <div className="card overflow-hidden">
            <table className="data">
              <thead>
                <tr><th>Target</th><th>Summary</th><th>Status</th><th>Reviewed</th></tr>
              </thead>
              <tbody>
                {reviewed.map((p) => (
                  <tr key={p.id}>
                    <td>{TARGET_LABELS[p.target] ?? p.target}</td>
                    <td>{p.summary}</td>
                    <td>
                      <span className={`badge ${p.status === "approved" ? "badge-resolved" : p.status === "rejected" ? "badge-disputed" : "badge-open"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="text-[color:var(--muted)]">
                      {p.reviewedAt ? new Date(p.reviewedAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
