import { listChronology } from "@/lib/repo";

export default async function ChronologyPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const events = await listChronology(caseId);
  return (
    <div>
      <h1 className="text-xl font-semibold mb-5">Chronology</h1>
      {events.length === 0 ? (
        <div className="card p-8 text-center text-[color:var(--muted)]">No chronology events yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data">
            <thead>
              <tr><th>Date</th><th>Event</th><th>Type</th></tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap font-medium">{e.date}</td>
                  <td>
                    <div className="font-medium">{e.title}</div>
                    <div className="text-[color:var(--muted)] text-[12px]">{e.description}</div>
                  </td>
                  <td><span className="type-tag">{e.statementType.replace(/_/g, " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
