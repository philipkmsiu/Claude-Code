"use client";

import { useState } from "react";
import type { GraphEdge, GraphNode } from "@/lib/types";

const TYPE_COLOR: Record<string, string> = {
  party: "#1e3a5f",
  person: "#2563eb",
  organisation: "#0891b2",
  date: "#b8842b",
  amount: "#15803d",
  clause: "#7c3aed",
  authority: "#b91c1c",
  location: "#0d9488",
  issue: "#db2777",
};

export default function GraphView({
  nodes,
  edges,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const [hover, setHover] = useState<string | null>(null);

  // Show the most-mentioned entities to keep the picture legible.
  const top = [...nodes].sort((a, b) => b.mentions - a.mentions).slice(0, 18);
  const idx = new Map(top.map((n, i) => [n.id, i]));
  const shownEdges = edges.filter((e) => idx.has(e.fromId) && idx.has(e.toId));

  const W = 640;
  const H = 460;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) / 2 - 70;

  const pos = top.map((_, i) => {
    const a = (2 * Math.PI * i) / top.length - Math.PI / 2;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });

  if (top.length === 0) {
    return (
      <div className="card p-8 text-center text-[color:var(--muted)]">
        No graph yet. Ingest documents to build the knowledge graph.
      </div>
    );
  }

  const maxWeight = Math.max(1, ...shownEdges.map((e) => e.weight));

  return (
    <div className="card p-4 overflow-auto">
      <svg width={W} height={H} className="mx-auto block">
        {shownEdges.map((e) => {
          const a = pos[idx.get(e.fromId)!];
          const b = pos[idx.get(e.toId)!];
          const active = hover === e.fromId || hover === e.toId;
          return (
            <line
              key={e.id}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={active ? "#1e3a5f" : "#cbd5e1"}
              strokeWidth={1 + (e.weight / maxWeight) * 4}
              strokeOpacity={hover && !active ? 0.15 : 0.7}
            />
          );
        })}
        {top.map((n, i) => {
          const p = pos[i];
          const color = TYPE_COLOR[n.entityType] ?? "#64748b";
          const r = 6 + Math.min(n.mentions, 8);
          const dim = hover && hover !== n.id;
          return (
            <g
              key={n.id}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer", opacity: dim ? 0.35 : 1 }}
            >
              <circle cx={p.x} cy={p.y} r={r} fill={color} />
              <text
                x={p.x}
                y={p.y - r - 4}
                textAnchor="middle"
                fontSize="11"
                fill="#0f172a"
              >
                {n.label.length > 22 ? n.label.slice(0, 21) + "…" : n.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {Object.entries(TYPE_COLOR).map(([t, c]) => (
          <span key={t} className="flex items-center gap-1 text-[11px] text-[color:var(--muted)]">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: c }} />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
