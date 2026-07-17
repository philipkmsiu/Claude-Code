# Implementation plan & status

Phase 1 delivers a functional private MVP. This tracks the development method in
the product spec (section 9) and the Phase 1 scope (section 8).

## Status legend
- ✅ working
- 🟡 partial / interface + fallback in place
- ⬜ not started

## Phase 1 scope status

| # | Feature | Status | Notes |
| --- | --- | --- | --- |
| 1 | Authentication | ✅ | Signed-cookie session, bcrypt, 8h timeout |
| 2 | Case creation | ✅ | `/cases/new` |
| 3 | Case dashboard | ✅ | stats + summary preview |
| 4 | Document upload | ✅ | `POST /api/cases/[id]/documents` |
| 5 | Document metadata | ✅ | source type, document date vs upload date |
| 6 | Text extraction | ✅ | PDF/DOCX/XLSX/CSV/TXT/MD, page-aware |
| 7 | Version / superseded handling | ✅ | versions + supersede links |
| 8 | Master Case Summary | ✅ | living, versioned |
| 9 | Issues Register | ✅ | list/detail + create |
| 10 | Chronology | ✅ | typed events |
| 11 | Hybrid search | ✅ | vector + keyword + recency + contrary |
| 12 | Case-specific AI chat | ✅ | grounded; OpenAI or offline fallback |
| 13 | Source citations | ✅ | doc/page/paragraph/clause/quote |
| 14 | Proposed memory updates | ✅ | emitted per analysis |
| 15 | Approve / reject memory | ✅ | approve/edit/reject/defer |
| 16 | Version history | ✅ | documents, summary, issues |
| 17 | Audit log | ✅ | append-only, per case |
| 18 | Word / Excel / Markdown export | ✅ | + JSON |

Out of Phase 1 scope (excluded per spec): billing, public registration, complex
team permissions.

## Development-method steps

- **Step 1 Repository assessment & docs** — ✅ (this repo was empty; scaffolded)
- **Step 2 Architecture** — ✅ `architecture.md`
- **Step 3 Database** — ✅ types in `src/lib/types.ts`; Postgres migration target documented
- **Step 4 UI** — ✅ all principal screens
- **Step 5 Document ingestion** — ✅
- **Step 6 AI chat** — ✅ structured answer contract
- **Step 7 Memory review** — ✅
- **Step 8 Testing** — ✅ vitest suites (see `src/lib/__tests__`)
- **Step 9 Documentation** — ✅ this file + README + setup guide

## Known limitations / next tasks

- Data layer is the local JSON store; the Supabase/pgvector adapter is specified
  (`database-schema.md`) but not yet implemented.
- OCR for scanned PDFs is not implemented (text-based extraction only).
- RBAC is modelled (`case_members`, roles) but Phase 1 runs effectively
  single-user; enforcement beyond authentication is minimal.
- Issue-analysis versions are surfaced but AI-driven issue-note authoring is a
  follow-up.

## Recommended next development task

Implement the Supabase adapter behind `src/lib/db` (mirroring `getDb`/`mutate`),
add pgvector ANN retrieval, and enable RLS policies keyed on `case_members`.
