import type { EntityType } from "@/lib/types";

export interface ExtractedEntity {
  entityType: EntityType;
  label: string;
}

const MONTHS =
  "January|February|March|April|May|June|July|August|September|October|November|December";

const ORG_SUFFIX =
  "Ltd|Limited|Co|Company|Corporation|Corp|Construction|Contractors|Contractor|Developments|Development|Engineering|Group|Holdings|Associates|Partners|Consultants|Chambers";

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function push(
  out: Map<string, ExtractedEntity>,
  entityType: EntityType,
  label: string,
) {
  const clean = label.replace(/\s+/g, " ").trim();
  if (clean.length < 2) return;
  const key = `${entityType}:${norm(clean)}`;
  if (!out.has(key)) out.set(key, { entityType, label: clean });
}

export interface ExtractOptions {
  claimant?: string;
  respondent?: string;
}

// Deterministic, offline entity extraction tuned for construction-arbitration
// text. Used as the default and as the fallback when no LLM is configured.
export function extractEntities(
  text: string,
  opts: ExtractOptions = {},
): ExtractedEntity[] {
  const out = new Map<string, ExtractedEntity>();

  // Clauses
  for (const m of text.matchAll(/\bcl(?:ause)?\.?\s*(\d+(?:\.\d+)*)/gi)) {
    push(out, "clause", `Clause ${m[1]}`);
  }

  // Dates: "30 June 2024", "June 2024", ISO
  for (const m of text.matchAll(
    new RegExp(`\\b(\\d{1,2}\\s+(?:${MONTHS})\\s+\\d{4})\\b`, "gi"),
  )) {
    push(out, "date", m[1]);
  }
  for (const m of text.matchAll(new RegExp(`\\b((?:${MONTHS})\\s+\\d{4})\\b`, "gi"))) {
    push(out, "date", m[1]);
  }
  for (const m of text.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)) {
    push(out, "date", m[1]);
  }

  // Monetary amounts
  for (const m of text.matchAll(
    /((?:HK)?\$\s?[\d,]+(?:\.\d+)?(?:\s?(?:million|m|k|bn))?)/gi,
  )) {
    push(out, "amount", m[1]);
  }

  // Legal authorities: "X v Y (YYYY..." style citations
  for (const m of text.matchAll(
    /\b([A-Z][A-Za-z.&'’-]+(?:\s+[A-Z][A-Za-z.&'’-]+)*\s+v\.?\s+[A-Z][A-Za-z.&'’-]+(?:\s+[A-Z][A-Za-z.&'’-]+)*)\s*[\(\[]\s*\d{4}/g,
  )) {
    push(out, "authority", m[1]);
  }

  // Persons: honorific + name
  for (const m of text.matchAll(
    /\b(Mr|Ms|Mrs|Miss|Dr|Prof|Ir|Sir)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
  )) {
    push(out, "person", `${m[1]} ${m[2]}`.replace(/\.\s/, " "));
  }

  // Organisations: capitalised phrase ending with a company suffix
  for (const m of text.matchAll(
    new RegExp(
      `\\b([A-Z][A-Za-z&'’-]+(?:\\s+[A-Z][A-Za-z&'’-]+){0,4}\\s+(?:${ORG_SUFFIX}))\\b`,
      "g",
    ),
  )) {
    push(out, "organisation", m[1]);
  }

  // Known parties from the case record (map the party name when it appears).
  for (const party of [opts.claimant, opts.respondent]) {
    if (party && party.length > 1 && text.toLowerCase().includes(party.toLowerCase())) {
      push(out, "party", party);
    }
  }

  return [...out.values()];
}
