# Security & confidentiality notes

The application holds confidential arbitration and construction-dispute
material. This documents the Phase 1 controls and the intended production
hardening.

## Implemented (Phase 1)

- **Server-side secrets.** `OPENAI_API_KEY` and `SESSION_SECRET` are only read in
  server modules (`src/lib/ai/openai.ts`, `src/lib/auth.ts`). No secret is passed
  to client components.
- **Authentication.** Email/password with **bcrypt** hashes. Sessions are a
  signed (HMAC-SHA256) HttpOnly cookie with `SameSite=Lax`, `Secure` in
  production, and an **8-hour timeout**.
- **Authorisation guards.** Every case route uses `guardCase()`; every API route
  checks `getCurrentUser()` before doing work.
- **Cross-case isolation.** All data access goes through case-scoped repository
  functions that filter by `case_id`. No query reads across cases.
- **Audit trail.** Login, ingestion, chat answers, memory approvals/rejections
  and exports are recorded in `audit_logs` (append-only) and shown per case.
- **Approved-memory protection.** The AI cannot mutate approved memory; changes
  require explicit human approval and preserve prior versions.
- **Confirmation before destructive actions.** Reject is an explicit, separate
  action from approve in the Memory Review UI.

## Data-integrity rules (enforced in product behaviour)

The AI/answer layer and data model enforce the section-7 rules, notably:
never invent facts/citations/clauses/authorities; distinguish document date vs
upload date; distinguish pleaded facts from evidence; label AI inference;
preserve source references and version history; display uncertainty on conflict.

## Production hardening (planned)

- Move to Supabase Auth + Postgres **Row Level Security** keyed on
  `case_members` for defence-in-depth cross-case isolation.
- Role-based access control across the seven roles (admin, consultant,
  solicitor, counsel, expert, client, read-only reviewer).
- Encrypted document storage (Supabase Storage), access logs, deletion controls,
  and managed backup/restore.
- Rotate `SESSION_SECRET`, enforce HTTPS/HSTS, and add rate limiting on
  auth and AI endpoints.

## Secrets handling

- Never commit real secrets. `.env*` is gitignored; `.env.example` documents the
  variables with placeholder values.
- Confidential case data must never be placed in test fixtures; tests use
  synthetic fictional data only.
