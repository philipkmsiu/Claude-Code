import neo4j, { type Driver } from "neo4j-driver";
import { nowIso } from "@/lib/util";
import type { GraphEdge, GraphNode, EntityType } from "@/lib/types";
import type { GraphStore, GraphView, IndexInput } from "@/lib/graph/store";

const MAX_ENTITIES_PER_CHUNK = 12;

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

// Neo4j-backed knowledge graph. Activated when NEO4J_URI is set. All nodes and
// relationships carry caseId and every query filters by it (cross-case
// isolation). Mirrors the LocalGraphStore surface exactly.
export class Neo4jGraphStore implements GraphStore {
  readonly backend = "neo4j" as const;
  private driver: Driver;

  constructor() {
    const uri = process.env.NEO4J_URI as string;
    const user = process.env.NEO4J_USER || "neo4j";
    const password = process.env.NEO4J_PASSWORD || "neo4j";
    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      disableLosslessIntegers: true,
    });
  }

  async ping(): Promise<boolean> {
    const session = this.driver.session();
    try {
      await session.run("RETURN 1 AS ok");
      return true;
    } catch {
      return false;
    } finally {
      await session.close();
    }
  }

  async indexEntities({ caseId, chunkId, documentId, entities }: IndexInput): Promise<void> {
    const limited = entities.slice(0, MAX_ENTITIES_PER_CHUNK).map((e) => ({
      entityType: e.entityType,
      normalized: normalize(e.label),
      label: e.label,
    }));
    if (limited.length === 0) return;

    const session = this.driver.session();
    try {
      await session.run(
        `MERGE (c:Chunk {id: $chunkId, caseId: $caseId})
           ON CREATE SET c.documentId = $documentId
         WITH c
         UNWIND $entities AS ent
         MERGE (e:Entity {caseId: $caseId, entityType: ent.entityType, normalized: ent.normalized})
           ON CREATE SET e.id = randomUUID(), e.label = ent.label, e.mentions = 0, e.createdAt = $now
         SET e.mentions = e.mentions + 1
         MERGE (e)-[:MENTIONED_IN]->(c)`,
        { caseId, chunkId, documentId, entities: limited, now: nowIso() },
      );

      const pairs: { an: string; at: string; bn: string; bt: string }[] = [];
      for (let i = 0; i < limited.length; i++) {
        for (let j = i + 1; j < limited.length; j++) {
          pairs.push({
            an: limited[i].normalized,
            at: limited[i].entityType,
            bn: limited[j].normalized,
            bt: limited[j].entityType,
          });
        }
      }
      if (pairs.length > 0) {
        await session.run(
          `UNWIND $pairs AS p
           MATCH (a:Entity {caseId: $caseId, entityType: p.at, normalized: p.an})
           MATCH (b:Entity {caseId: $caseId, entityType: p.bt, normalized: p.bn})
           MERGE (a)-[r:CO_OCCURS]-(b)
             ON CREATE SET r.weight = 0
           SET r.weight = r.weight + 1`,
          { caseId, pairs },
        );
      }
    } finally {
      await session.close();
    }
  }

  async entitiesInChunks(caseId: string, chunkIds: string[]): Promise<string[]> {
    if (chunkIds.length === 0) return [];
    const session = this.driver.session();
    try {
      const res = await session.run(
        `MATCH (e:Entity {caseId: $caseId})-[:MENTIONED_IN]->(c:Chunk {caseId: $caseId})
         WHERE c.id IN $chunkIds RETURN DISTINCT e.id AS id`,
        { caseId, chunkIds },
      );
      return res.records.map((r) => r.get("id") as string);
    } finally {
      await session.close();
    }
  }

  async chunksForEntities(caseId: string, nodeIds: string[]): Promise<string[]> {
    if (nodeIds.length === 0) return [];
    const session = this.driver.session();
    try {
      const res = await session.run(
        `MATCH (e:Entity {caseId: $caseId})-[:MENTIONED_IN]->(c:Chunk {caseId: $caseId})
         WHERE e.id IN $nodeIds RETURN DISTINCT c.id AS id`,
        { caseId, nodeIds },
      );
      return res.records.map((r) => r.get("id") as string);
    } finally {
      await session.close();
    }
  }

  async getGraph(caseId: string): Promise<GraphView> {
    const session = this.driver.session();
    try {
      const nodesRes = await session.run(
        `MATCH (e:Entity {caseId: $caseId})
         RETURN e.id AS id, e.entityType AS entityType, e.label AS label,
                e.normalized AS normalized, e.mentions AS mentions, e.createdAt AS createdAt`,
        { caseId },
      );
      const nodes: GraphNode[] = nodesRes.records.map((r) => ({
        id: r.get("id") as string,
        caseId,
        entityType: r.get("entityType") as EntityType,
        label: r.get("label") as string,
        normalized: r.get("normalized") as string,
        mentions: Number(r.get("mentions") ?? 0),
        createdAt: (r.get("createdAt") as string) ?? nowIso(),
      }));

      const edgesRes = await session.run(
        `MATCH (a:Entity {caseId: $caseId})-[r:CO_OCCURS]-(b:Entity {caseId: $caseId})
         WHERE a.id < b.id
         RETURN a.id AS fromId, b.id AS toId, r.weight AS weight`,
        { caseId },
      );
      const edges: GraphEdge[] = edgesRes.records.map((r) => ({
        id: `${r.get("fromId")}_${r.get("toId")}`,
        caseId,
        type: "CO_OCCURS",
        fromId: r.get("fromId") as string,
        toId: r.get("toId") as string,
        chunkId: null,
        documentId: null,
        weight: Number(r.get("weight") ?? 1),
        createdAt: nowIso(),
      }));
      return { nodes, edges };
    } finally {
      await session.close();
    }
  }

  async stats(caseId: string): Promise<{ nodes: number; edges: number }> {
    const session = this.driver.session();
    try {
      const res = await session.run(
        `MATCH (e:Entity {caseId: $caseId})
         OPTIONAL MATCH (e)-[r:CO_OCCURS]-()
         RETURN count(DISTINCT e) AS nodes, count(DISTINCT r) AS edges`,
        { caseId },
      );
      const rec = res.records[0];
      return {
        nodes: Number(rec?.get("nodes") ?? 0),
        edges: Number(rec?.get("edges") ?? 0),
      };
    } finally {
      await session.close();
    }
  }
}
