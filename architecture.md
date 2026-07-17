# Architecture

## Overview

KM Claim OS is a Next.js (App Router) application. All confidential logic —
authentication, document ingestion, retrieval, AI calls, memory approval and
exports — runs server-side. The client only renders UI and calls server actions
or API routes.

```
Browser (React UI)
  → Server Actions / Route Handlers (Next.js, server-only)
    → Domain services (lib/*)
      → Data layer (local JSON store  |  Supabase/Postgres + pgvector)
      → OpenAI API (server-side, optional)
```

## Layers

### 1. UI (`src/app`, `src/components`)
Server components fetch data directly through the case-scoped repository; client
components (`LoginForm`, `UploadForm`, `ChatPanel`) handle interactivity. The
visual language is a restrained, desktop-first professional style (tables,
status badges, version badges, warning banners, expandable citations).

### 2. Application layer (server actions + route handlers)
- Server actions (`src/app/actions/*`) handle mutations tied to forms (login,
  create case/issue, memory review).
- Route handlers (`src/app/api/**`) handle file upload, chat, and export where a
  request/response with binary or JSON payloads is needed.
- Every entry point authenticates via `getCurrentUser()` and authorises the case
  via `guardCase()`.

### 3. Domain services (`src/lib`)
- `documents/` — extraction, page-aware chunking, ingestion.
- `ai/` — OpenAI client, embeddings, grounded chat.
- `retrieval.ts` — hybrid retrieval + context building.
- `repo.ts` — **case-scoped** data access (the cross-case isolation boundary).
- `export.ts` — Word/Excel/Markdown/JSON exports.
- `auth.ts` — signed-cookie session + bcrypt password hashing.

### 4. Data layer (`src/lib/db`)
A single small surface (`getDb`, `mutate`) backs the repository. The default
implementation persists a JSON document to `.data/db.json`. This is the local
development fallback; the Supabase adapter implements the same surface in
production. Because `repo.ts` is the only caller, swapping the backend does not
touch UI or services.

## Document-processing pipeline

1. Upload (multipart) → `POST /api/cases/[caseId]/documents`.
2. `sha256` hash for duplicate detection.
3. Text extraction per format (`documents/extract.ts`), producing **page-aware**
   text with an extraction-confidence heuristic.
4. **Parent-child chunking** (`documents/chunk.ts`): each page is a parent chunk
   (context); paragraphs are child chunks (retrieval units) tagged with
   page/paragraph/clause/heading.
5. Embedding of child chunks (`ai/embed.ts`): OpenAI when a key is present,
   otherwise a deterministic hashed-bag-of-tokens vector (offline).
6. Persist document → version → pages → chunks, plus an audit entry.

## Retrieval pipeline (`retrieval.ts`)

Hybrid retrieval, case-scoped:
1. Retrieve approved memory (Master Case Summary).
2. Retrieve issue notes.
3. Retrieve source child-chunks by fused score = `0.6·cosine + 0.4·keyword`,
   with a small **recency/version weighting**.
4. **Actively retrieve contrary/adverse passages** (anti confirmation-bias).
5. Rerank and bound the context passed to the model.

## AI prompt workflow (`ai/chat.ts`)

The answer endpoint always returns a structured object: `answer`,
`statementType` (fact/allegation/inference/…), `citations`, `memoryRecordsUsed`,
`retrievedChunkIds`, `uncertainties`, `contraryEvidence`,
`suggestedMemoryUpdates`, `confidence`, `usedModel`. When no OpenAI key is set, a
deterministic grounded builder produces the same shape from retrieved passages,
so the product is fully demonstrable offline.

## Memory approval workflow

AI never writes approved memory. After analysis it emits *proposed* memory
updates (`proposed_memory_updates`). A human approves / edits / rejects / defers
each on the Memory Review screen. Approval:
- writes an `approved_memory_updates` record,
- materialises the change (e.g. a **new** Master Summary version — old versions
  are preserved),
- writes an `audit_logs` entry.

## Version-control logic

- Documents have `document_versions`; superseding a document links the two and
  the older one is flagged Superseded (never deleted).
- Master Case Summary and Issues keep append-only version chains; the "current"
  pointer moves forward.

## Citation structure

Every citation preserves document id, file name, page, paragraph, clause,
heading and a verbatim quote drawn from a retrieved chunk. AI summaries are
labelled `ai_generated` and never presented as primary evidence.

## Security model

See `security-notes.md`. Summary: server-side secrets, signed HttpOnly session
cookie with timeout, bcrypt passwords, case-scoped queries preventing cross-case
leakage, audit logging, and confirmation before destructive memory changes.

## Export architecture

`export.ts` gathers a case bundle through the case-scoped repository and renders
Word (`docx`), Excel (`xlsx`), Markdown and JSON. Exports are logged.

## Future: MCP layer

The spec envisions an MCP server exposing the same case memory to external
clients. Because all reads/writes funnel through `repo.ts`, an MCP server would
wrap those same functions.
