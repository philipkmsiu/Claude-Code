import Link from "next/link";
import {
  getCase,
  listDocuments,
  listIssues,
  listChronology,
  getMasterSummary,
  listProposedMemory,
} from "@/lib/repo";

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card p-4 hover:border-[color:var(--primary)]">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-[12px] text-[color:var(--muted)] mt-1">{label}</div>
    </Link>
  );
}

export default async function CaseDashboard({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const [c, docs, issues, chron, summary, proposed] = await Promise.all([
    getCase(caseId),
    listDocuments(caseId),
    listIssues(caseId),
    listChronology(caseId),
    getMasterSummary(caseId),
    listProposedMemory(caseId),
  ]);
  const disputedIssues = issues.filter((i) => i.status !== "resolved");
  const pendingMemory = proposed.filter((p) => p.status === "proposed");

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <Link href={`/cases/${caseId}/chat`} className="btn btn-primary">Ask the case AI</Link>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
          <div><div className="label">Claimant</div>{c?.claimant || "—"}</div>
          <div><div className="label">Respondent</div>{c?.respondent || "—"}</div>
          <div><div className="label">Tribunal</div>{c?.tribunal || "—"}</div>
          <div><div className="label">Reference</div>{c?.reference || "—"}</div>
        </div>
        {c?.description && (
          <p className="mt-4 text-[13px] text-[color:var(--foreground)]">{c.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Documents" value={docs.length} href={`/cases/${caseId}/documents`} />
        <Stat label="Live issues" value={disputedIssues.length} href={`/cases/${caseId}/issues`} />
        <Stat label="Chronology events" value={chron.length} href={`/cases/${caseId}/chronology`} />
        <Stat label="Memory to review" value={pendingMemory.length} href={`/cases/${caseId}/memory`} />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Master Case Summary</h2>
          <Link href={`/cases/${caseId}/summary`} className="text-[13px] text-[color:var(--primary)] hover:underline">
            View & versions →
          </Link>
        </div>
        {summary.currentVersion ? (
          <p className="text-[13px] whitespace-pre-wrap text-[color:var(--foreground)]">
            {summary.currentVersion.content.slice(0, 600)}
            {summary.currentVersion.content.length > 600 ? "…" : ""}
          </p>
        ) : (
          <p className="text-[13px] text-[color:var(--muted)]">
            No approved summary yet. Approve an AI-suggested memory update to build it.
          </p>
        )}
      </div>
    </div>
  );
}
