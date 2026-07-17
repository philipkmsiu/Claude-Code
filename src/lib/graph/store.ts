import { getDb, mutate } from "@/lib/db/store";
import { newId, nowIso } from "@/lib/util";
import { Neo4jGraphStore } from "@/lib/graph/neo4j";
import type { ExtractedEntity } from "@/lib/graph/extract";
import type { GraphEdge, GraphNode } from "@/lib/types";

export interface IndexInput {
  caseId: string;
  chunkId: string;
  documentId: string;
  entities: ExtractedEntity[];
}

export interface GraphView {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Backend-agnostic knowledge-graph surface. Two implementations exist: the
// local JSON store (default / offline fallback) and Neo4j (when NEO4J_URI is
// set). Every method is case-scoped to prevent cross-case leakage.
export interface GraphStore {
  readonly backend: "local" | "neo4j";
  ping(): Promise<boolean>;
  indexEntities(input: IndexInput): Promise<void>;
  entitiesInChunks(caseId: string, chunkIds: string[]): Promise<string[]>;
  chunksForEntities(caseId: string, nodeIds: string[]): Promise<string[]>;
  getGraph(caseId: string): Promise<GraphView>;
  stats(caseId: string): Promise<{ nodes: number; edges: number }>;
}

const MAX_ENTITIES_PER_CHUNK = 12;

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

class LocalGraphStore implements GraphStore {
  readonly backend = "local" as const;

  async ping(): Promise<boolean> {
    return true;
  }

  async indexEntities({ caseId, chunkId, documentId, entities }: IndexInput): Promise<void> {
    const limited = entities.slice(0, MAX_ENTITIES_PER_CHUNK);
    await mutate((db) => {
      const nodeIds: string[] = [];
      for (const e of limited) {
        const normalized = normalize(e.label);
        let node = db.graph_nodes.find(
          (n) =>
            n.caseId === caseId &&
            n.entityType === e.entityType &&
            n.normalized === normalized,
        );
        if (!node) {
          node = {
            id: newId("gn"),
            caseId,
            entityType: e.entityType,
            label: e.label,
            normalized,
            mentions: 0,
            createdAt: nowIso(),
          };
          db.graph_nodes.push(node);
        }
        node.mentions += 1;
        nodeIds.push(node.id);

        // entity -> chunk provenance edge (dedup per node+chunk)
        const exists = db.graph_edges.find(
          (ed) =>
            ed.caseId === caseId &&
            ed.type === "MENTIONED_IN" &&
            ed.fromId === node!.id &&
            ed.toId === chunkId,
        );
        if (!exists) {
          db.graph_edges.push({
            id: newId("ge"),
            caseId,
            type: "MENTIONED_IN",
            fromId: node.id,
            toId: chunkId,
            chunkId,
            documentId,
            weight: 1,
            createdAt: nowIso(),
          });
        }
      }

      // Co-occurrence edges between entities sharing this chunk.
      for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
          const [a, b] = [nodeIds[i], nodeIds[j]].sort();
          let edge = db.graph_edges.find(
            (ed) =>
              ed.caseId === caseId &&
              ed.type === "CO_OCCURS" &&
              ed.fromId === a &&
              ed.toId === b,
          );
          if (!edge) {
            edge = {
              id: newId("ge"),
              caseId,
              type: "CO_OCCURS",
              fromId: a,
              toId: b,
              chunkId: null,
              documentId: null,
              weight: 0,
              createdAt: nowIso(),
            };
            db.graph_edges.push(edge);
          }
          edge.weight += 1;
        }
      }
    });
  }

  async entitiesInChunks(caseId: string, chunkIds: string[]): Promise<string[]> {
    const db = await getDb();
    const set = new Set(chunkIds);
    const ids = new Set<string>();
    for (const e of db.graph_edges) {
      if (e.caseId === caseId && e.type === "MENTIONED_IN" && set.has(e.toId)) {
        ids.add(e.fromId);
      }
    }
    return [...ids];
  }

  async chunksForEntities(caseId: string, nodeIds: string[]): Promise<string[]> {
    const db = await getDb();
    const set = new Set(nodeIds);
    const ids = new Set<string>();
    for (const e of db.graph_edges) {
      if (e.caseId === caseId && e.type === "MENTIONED_IN" && set.has(e.fromId)) {
        ids.add(e.toId);
      }
    }
    return [...ids];
  }

  async getGraph(caseId: string): Promise<GraphView> {
    const db = await getDb();
    return {
      nodes: db.graph_nodes.filter((n) => n.caseId === caseId),
      edges: db.graph_edges.filter((e) => e.caseId === caseId),
    };
  }

  async stats(caseId: string): Promise<{ nodes: number; edges: number }> {
    const db = await getDb();
    return {
      nodes: db.graph_nodes.filter((n) => n.caseId === caseId).length,
      edges: db.graph_edges.filter((e) => e.caseId === caseId).length,
    };
  }
}

// Singleton factory. Uses Neo4j when NEO4J_URI is configured, else the local
// JSON-backed store so the feature works fully offline.
let instance: GraphStore | undefined;

export function getGraphStore(): GraphStore {
  if (instance) return instance;
  instance = process.env.NEO4J_URI ? new Neo4jGraphStore() : new LocalGraphStore();
  return instance;
}

// Test helper.
export function __setGraphStore(store: GraphStore | undefined): void {
  instance = store;
}
