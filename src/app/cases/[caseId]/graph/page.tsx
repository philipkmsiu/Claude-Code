import GraphView from "@/components/GraphView";
import { getGraphStore } from "@/lib/graph/store";
import type { GraphNode } from "@/lib/types";

export default async function GraphPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const store = getGraphStore();
  const { nodes, edges } = await store.getGraph(caseId);

  const byType = new Map<string, GraphNode[]>();
  for (const n of nodes) {
    const arr = byType.get(n.entityType) ?? [];
    arr.push(n);
    byType.set(n.entityType, arr);
  }

  const nodeLabel = new Map(nodes.map((n) => [n.id, n.label]));
  const topEdges = [...edges]
    .filter((e) => e.type === "CO_OCCURS")
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 15);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">Knowledge Graph</h1>
        <span className="badge">
          backend: {store.backend}
        </span>
      </div>
      <p className="text-[13px] text-[color:var(--muted)] mb-5">
        Entities and relationships extracted from this case&apos;s documents. Graph RAG
        expands from the passages a query retrieves to related passages via shared
        entities (multi-hop), improving recall beyond pure vector similarity.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card p-4"><div className="text-2xl font-semibold">{nodes.length}</div><div className="text-[12px] text-[color:var(--muted)]">Entities</div></div>
        <div className="card p-4"><div className="text-2xl font-semibold">{edges.filter((e) => e.type === "CO_OCCURS").length}</div><div className="text-[12px] text-[color:var(--muted)]">Co-occurrence links</div></div>
        <div className="card p-4"><div className="text-2xl font-semibold">{byType.size}</div><div className="text-[12px] text-[color:var(--muted)]">Entity types</div></div>
        <div className="card p-4"><div className="text-2xl font-semibold">{edges.filter((e) => e.type === "MENTIONED_IN").length}</div><div className="text-[12px] text-[color:var(--muted)]">Mentions</div></div>
      </div>

      <div className="mb-6">
        <GraphView nodes={nodes} edges={edges} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Entities by type</h2>
          {nodes.length === 0 ? (
            <p className="text-[13px] text-[color:var(--muted)]">No entities yet.</p>
          ) : (
            <div className="space-y-3">
              {[...byType.entries()].map(([type, list]) => (
                <div key={type}>
                  <div className="label">{type} ({list.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {list
                      .sort((a, b) => b.mentions - a.mentions)
                      .slice(0, 12)
                      .map((n) => (
                        <span key={n.id} className="badge" title={`${n.mentions} mention(s)`}>
                          {n.label}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-3">Top relationships</h2>
          {topEdges.length === 0 ? (
            <p className="text-[13px] text-[color:var(--muted)]">No relationships yet.</p>
          ) : (
            <table className="data">
              <thead><tr><th>Entity</th><th>Entity</th><th>Weight</th></tr></thead>
              <tbody>
                {topEdges.map((e) => (
                  <tr key={e.id}>
                    <td>{nodeLabel.get(e.fromId) ?? e.fromId}</td>
                    <td>{nodeLabel.get(e.toId) ?? e.toId}</td>
                    <td>{e.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
