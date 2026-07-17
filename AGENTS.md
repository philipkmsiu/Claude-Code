# AGENTS.md — KM Claim OS

Permanent coding and product rules for future agent/Codex sessions. Read
`architecture.md`, `database-schema.md` and `implementation-plan.md` before
making material changes.

## Product principles

- This is a **project-memory** case system for Hong Kong construction
  arbitration/adjudication, not a generic chatbot. Continuity of case memory is
  the core value.
- Maintain **source-grounded citations** for every material factual proposition.
- The AI must **never** silently rewrite approved case memory. All material
  changes require explicit human approval and an audit trail.
- Never invent facts, document citations, contract clause wording, or legal
  authorities. Label AI inference as such. Display uncertainty on conflict.
- Never mix data between cases. All case data access must be scoped by `caseId`.
- Distinguish document date from upload date, and pleaded facts from evidence.
- Keep confidential case data out of test fixtures (use synthetic data only).

## Engineering rules

- Preserve backwards compatibility unless there is a documented reason not to.
- Do not remove working functionality without explanation.
- Do not replace secure server-side logic with client-side shortcuts; secrets
  (API keys, session secret) stay server-side only.
- Keep migrations reversible where practicable; preserve version history and
  audit trails.
- Add tests for every material feature (`src/lib/__tests__`, run `npm run test`).
- Use TypeScript strict mode. Prefer maintainable, understandable code.
- All case reads/writes go through `src/lib/repo.ts` (the isolation boundary) so
  the data backend (local JSON store today, Supabase/pgvector later) can be
  swapped without touching UI/services.
- Update `README.md` and `implementation-plan.md` after each major task; record
  unfinished work clearly.

## Cursor Cloud specific instructions

- **Stack:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript strict +
  Tailwind 4. Node 22 is available on the VM.
- **Standard commands** are in `package.json`: `npm run dev` (port 3000),
  `npm run build`, `npm run lint`, `npm run typecheck`, `npm run test`,
  `npm run seed`. Prefer these over ad-hoc invocations.
- **Data store:** the app persists to a local JSON file at `.data/db.json`
  (gitignored) — this is the dev fallback for Supabase. Deleting it resets all
  data. `npm run seed` **wipes and recreates** `.data/db.json` with the fictional
  demo case; do not run it if you need to keep existing local data.
- **First run needs a login user.** There is no public registration. Run
  `npm run seed` before logging in. Demo login: `admin@kmclaim.test` / `demo1234`.
- **Bulk import:** `npm run import -- <folderPath> "<Case name>"` recursively
  ingests supported files (`.pdf .docx .xlsx .xls .csv .txt .md`) into a case,
  creating the case if it does not exist. Other file types are skipped.
- **IMPORTANT — restart after external script writes.** `npm run seed` and
  `npm run import` write directly to `.data/db.json`, but a running `next dev`
  server caches the DB in memory (a `globalThis` singleton that survives HMR) and
  only reads the file at startup. After running seed/import while the server is
  up, **restart `npm run dev`** or the new data will not appear in the UI. (Writes
  made *through* the app UI persist to disk normally and need no restart.)
- **OpenAI is optional.** With no `OPENAI_API_KEY`, embeddings and chat use a
  deterministic offline fallback (`local-fallback`), so the app is fully runnable
  and demonstrable without any external credential. Set the key in `.env.local`
  to enable real RAG. Never hardcode keys.
- **PDF extraction** uses `pdf-parse` v2 (class-based, `new PDFParse({data})`),
  backed by `pdfjs-dist`. Feeding non-PDF bytes to the PDF path throws
  `InvalidPDFException` — route by file extension (already handled in
  `src/lib/documents/extract.ts`).
- **`server-only` guard:** `src/lib/auth.ts` imports `server-only`, so it cannot
  be imported from scripts run outside Next (e.g. the seed). Hash passwords with
  `bcryptjs` directly in scripts instead.
- Fonts are system fonts (no `next/font/google`) to avoid build-time network
  fetches in sandboxed environments.
- **Retrieval design:** hybrid vector + keyword retrieval, bounded top-K context,
  and a lost-in-the-middle reorder (`reorderLostInTheMiddle` in
  `src/lib/retrieval.ts`) that puts the most relevant passages at the context
  edges. Graph RAG then expands from the top vector hits to related passages via
  shared entities (multi-hop) before building the bounded context.
- **Graph RAG / Neo4j:** the knowledge graph has a pluggable `GraphStore`
  (`src/lib/graph/store.ts`). Default is the local JSON store (fully offline). To
  use Neo4j, set `NEO4J_URI` / `NEO4J_USER` / `NEO4J_PASSWORD` and it switches
  automatically (`getGraphStore()`), no code change. The graph is built during
  ingestion, so after switching backends you must re-ingest/seed so the graph
  populates the new backend. Verify a live Neo4j with `npm run verify:neo4j`.
  Neo4j itself is optional infra (not installed by the update script); run it
  however you like (tarball + `bin/neo4j start`, or Docker) and point the env
  vars at it. Scripts (`seed`/`import`) only write to Neo4j if the `NEO4J_*` vars
  are present in their own environment (they do not read `.env.local`), so pass
  them inline, e.g. `NEO4J_URI=... npm run seed`.
- **Embeddings:** `npm run reembed` re-embeds all existing chunks with the
  currently-configured provider (run it after adding `OPENAI_API_KEY` so
  previously local-embedded docs switch to OpenAI vectors). Then restart the dev
  server.
