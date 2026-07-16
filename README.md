# KM Claim OS

Project-memory case-management web application for Hong Kong construction
arbitration and adjudication work. It combines a document knowledge base,
retrieval-augmented AI chat, a living Master Case Summary, an issues register,
chronology, and an explicit human-approved memory workflow with full version
history and audit trails.

> This is a Phase 1 private MVP. See `implementation-plan.md` for scope and
> status, and `architecture.md` for the design.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS 4**
- Server-side **OpenAI** integration (optional) with a deterministic offline fallback
- Document processing: `pdf-parse`, `mammoth` (DOCX), `xlsx` (XLSX/CSV)
- Exports: `docx` (Word), `xlsx` (Excel), Markdown, JSON
- Data layer: pluggable. **Local JSON store** by default (`.data/db.json`);
  Supabase/Postgres + pgvector is the production target (see `database-schema.md`).

## Quick start (non-programmer friendly)

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env.local
#    (Optional) add an OPENAI_API_KEY to enable OpenAI answers.
#    Without a key the app runs fully offline using a local fallback.

# 3. Load the demonstration case (fictional data)
npm run seed

# 4. Start the development server
npm run dev
#    Open http://localhost:3000
#    Login: admin@kmclaim.test / demo1234
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run test` | Vitest unit/integration tests |
| `npm run seed` | Reset and load the fictional demonstration case |
| `npm run import -- <folder> "<Case name>"` | Bulk-ingest a folder of documents into a case |

## Key documents

- `architecture.md` — application, retrieval and memory architecture
- `database-schema.md` — full schema and the migration path to Supabase/pgvector
- `implementation-plan.md` — phased plan and current status
- `security-notes.md` — security & confidentiality model
- `AGENTS.md` — permanent coding & product rules for future agents

## Environment variables

See `.env.example`. API keys are only ever read server-side and are never
exposed to the client.

## Data & backups

In local mode the entire database is the JSON file `.data/db.json`. Back it up by
copying that file. In production, back up via Supabase's managed backups.
