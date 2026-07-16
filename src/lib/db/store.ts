import { promises as fs } from "fs";
import path from "path";
import type { Database, TableName } from "@/lib/types";

// Local development data store.
//
// This is the "local development fallback" mandated by the spec for when a
// Supabase/Postgres credential is unavailable. It persists the whole database
// as a single JSON file. The public surface (getDb / mutate) is intentionally
// small so a Supabase-backed adapter can be swapped in later without touching
// callers (see architecture.md).

// KM_DATA_DIR lets tests (and alternative deployments) point the local store at
// an isolated directory so they never clobber the developer's .data/db.json.
const DATA_DIR = process.env.KM_DATA_DIR || path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

function emptyDb(): Database {
  return {
    users: [],
    cases: [],
    case_members: [],
    documents: [],
    document_versions: [],
    document_pages: [],
    document_chunks: [],
    issues: [],
    issue_versions: [],
    master_case_summaries: [],
    summary_versions: [],
    chronology_events: [],
    evidence_items: [],
    authorities: [],
    witnesses: [],
    chats: [],
    chat_messages: [],
    retrieval_logs: [],
    proposed_memory_updates: [],
    approved_memory_updates: [],
    tasks: [],
    audit_logs: [],
    exports: [],
  };
}

// Survive Next.js hot-module-replacement by caching on globalThis.
const globalForStore = globalThis as unknown as {
  __kmStore?: { db: Database | null; loading: Promise<Database> | null };
};

const cache = (globalForStore.__kmStore ??= { db: null, loading: null });

async function loadFromDisk(): Promise<Database> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    return { ...emptyDb(), ...parsed };
  } catch {
    return emptyDb();
  }
}

export async function getDb(): Promise<Database> {
  if (cache.db) return cache.db;
  if (!cache.loading) {
    cache.loading = loadFromDisk().then((db) => {
      cache.db = db;
      return db;
    });
  }
  return cache.loading;
}

async function persist(db: Database): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

// Serialise mutations to avoid interleaved read-modify-write races in dev.
let writeChain: Promise<unknown> = Promise.resolve();

export async function mutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    const db = await getDb();
    const result = await fn(db);
    await persist(db);
    return result;
  };
  const next = writeChain.then(run, run);
  // Keep the chain alive but never rejected so later writes still run.
  writeChain = next.catch(() => undefined);
  return next;
}

export function table<T extends TableName>(db: Database, name: T): Database[T] {
  return db[name];
}

// Test-only: reset the in-memory cache and remove the data file.
export async function __resetStoreForTests(): Promise<void> {
  cache.db = null;
  cache.loading = null;
  try {
    await fs.rm(DATA_FILE, { force: true });
  } catch {
    // ignore
  }
}
