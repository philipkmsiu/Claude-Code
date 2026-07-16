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
