# Database schema

The canonical TypeScript definitions live in `src/lib/types.ts`. The local
development store persists these as JSON (`.data/db.json`). This document
describes the same schema and the Postgres/Supabase migration target.

## Tables

| Table | Purpose | Key relations |
| --- | --- | --- |
| `users` | Application users | — |
| `cases` | Arbitration/adjudication matters | `created_by → users` |
| `case_members` | Case-level access (RBAC, future multi-user) | `case_id`, `user_id` |
| `documents` | Logical documents | `case_id`, `current_version_id`, `superseded_by_document_id` |
| `document_versions` | Version history + hash + extraction confidence | `document_id`, `case_id` |
| `document_pages` | Page-aware extracted text | `document_id`, `version_id`, `case_id` |
| `document_chunks` | Parent/child chunks + embeddings | `document_id`, `version_id`, `parent_id`, `case_id` |
| `issues` | Issues register | `case_id`, `current_version_id` |
| `issue_versions` | Issue analysis history | `issue_id`, `case_id` |
| `master_case_summaries` | One living summary per case | `case_id`, `current_version_id` |
| `summary_versions` | Summary version chain | `summary_id`, `case_id` |
| `chronology_events` | Dated events with statement type | `case_id`, `source_document_id` |
| `evidence_items` | Evidence register | `case_id`, `document_id` |
| `authorities` | Legal authorities register | `case_id` |
| `witnesses` | Witness records | `case_id` |
| `chats` | Chat threads | `case_id` |
| `chat_messages` | Messages incl. structured AI output | `chat_id`, `case_id` |
| `retrieval_logs` | What was retrieved per query | `case_id`, `chat_id` |
| `proposed_memory_updates` | AI-suggested memory changes | `case_id`, `message_id` |
| `approved_memory_updates` | Human-approved changes (audit) | `case_id`, `proposed_id` |
| `tasks` | Task / outstanding-questions list | `case_id` |
| `audit_logs` | Append-only audit trail | `case_id`, `user_id` |
| `exports` | Export history | `case_id`, `created_by` |

## Cross-case isolation

Every case-owned row carries `case_id`. The repository (`src/lib/repo.ts`) always
filters by `case_id`, and no query joins across cases. In Postgres this is
enforced additionally with Row Level Security policies keyed on `case_members`.

## Enumerated types

- `user_role`: administrator | claim_consultant | solicitor | counsel | expert | client | read_only_reviewer
- `statement_type`: fact | allegation | inference | legal_submission | expert_opinion | user_instruction | ai_generated | unverified
- `source_type`: contract | pleading | correspondence | witness_statement | expert_report | authority | drawing | certificate | other
- `memory_target`: master_case_summary | chronology | issues_register | parties_positions | evidence_register | authorities_register | witness_records | outstanding_questions | task_list
- `memory_update_status`: proposed | approved | rejected | deferred

## Postgres / Supabase migration target

The production migration (not required for the local MVP) is:

```sql
create extension if not exists vector;

create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  version_id uuid not null references document_versions(id) on delete cascade,
  parent_id uuid references document_chunks(id),
  is_parent boolean not null default false,
  page_number int,
  paragraph_number int,
  clause_number text,
  heading text,
  source_type text not null,
  text text not null,
  embedding vector(1536),          -- pgvector; ivfflat/hnsw index for ANN
  created_at timestamptz not null default now()
);
-- ... analogous tables for the rest, all with case_id + RLS policies.
```

Embeddings are stored as `vector(1536)` (OpenAI `text-embedding-3-small`). The
local store keeps the same vectors as JSON arrays so the retrieval math is
identical across backends.

## Versioning & soft-supersession rules

- Documents are never hard-deleted when superseded; `superseded_by_document_id`
  links forward and the UI badges the older version.
- `summary_versions` and `issue_versions` are append-only; the parent row's
  `current_version_id` advances. History is always retrievable.
