import Link from "next/link";
import { listCases } from "@/lib/repo";

export default async function CasesPage() {
  const cases = await listCases();
  return (
    <div className="max-w-[1400px] mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Cases</h1>
          <p className="text-[color:var(--muted)] text-[13px] mt-1">
            {cases.length} case{cases.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/cases/new" className="btn btn-primary">
          + New case
        </Link>
      </div>

      {cases.length === 0 ? (
        <div className="card p-10 text-center text-[color:var(--muted)]">
          No cases yet. Create your first case to begin building project memory.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data">
            <thead>
              <tr>
                <th>Case</th>
                <th>Reference</th>
                <th>Claimant</th>
                <th>Respondent</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link
                      href={`/cases/${c.id}`}
                      className="font-medium text-[color:var(--primary)] hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td>{c.reference}</td>
                  <td>{c.claimant}</td>
                  <td>{c.respondent}</td>
                  <td className="text-[color:var(--muted)]">
                    {new Date(c.updatedAt).toLocaleDateString()}
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
