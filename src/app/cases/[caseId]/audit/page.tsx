import { listAudit, getUserById } from "@/lib/repo";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const entries = await listAudit(caseId);
  const users = new Map<string, string>();
  for (const e of entries) {
    if (e.userId && !users.has(e.userId)) {
      const u = await getUserById(e.userId);
      users.set(e.userId, u?.name ?? e.userId);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-5">Audit History</h1>
      {entries.length === 0 ? (
        <div className="card p-8 text-center text-[color:var(--muted)]">No audit entries yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data">
            <thead>
              <tr><th>Time</th><th>User</th><th>Action</th><th>Detail</th></tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap text-[color:var(--muted)]">{new Date(e.createdAt).toLocaleString()}</td>
                  <td>{e.userId ? users.get(e.userId) : "system"}</td>
                  <td><span className="type-tag">{e.action}</span></td>
                  <td>{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
