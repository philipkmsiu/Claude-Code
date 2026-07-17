import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import * as XLSX from "xlsx";
import {
  getCase,
  getMasterSummary,
  listChronology,
  listIssues,
  listEvidence,
  listAuthorities,
  listDocuments,
} from "@/lib/repo";

export type ExportFormat = "word" | "excel" | "markdown" | "json";

interface CaseBundle {
  case: Awaited<ReturnType<typeof getCase>>;
  summary: string | null;
  issues: Awaited<ReturnType<typeof listIssues>>;
  chronology: Awaited<ReturnType<typeof listChronology>>;
  evidence: Awaited<ReturnType<typeof listEvidence>>;
  authorities: Awaited<ReturnType<typeof listAuthorities>>;
  documents: Awaited<ReturnType<typeof listDocuments>>;
}

async function gather(caseId: string): Promise<CaseBundle> {
  const [c, summary, issues, chronology, evidence, authorities, documents] =
    await Promise.all([
      getCase(caseId),
      getMasterSummary(caseId),
      listIssues(caseId),
      listChronology(caseId),
      listEvidence(caseId),
      listAuthorities(caseId),
      listDocuments(caseId),
    ]);
  return {
    case: c,
    summary: summary.currentVersion?.content ?? null,
    issues,
    chronology,
    evidence,
    authorities,
    documents,
  };
}

export function buildMarkdown(b: CaseBundle): string {
  const lines: string[] = [];
  lines.push(`# ${b.case?.name ?? "Case"} — Case Report`);
  lines.push("");
  lines.push(`- Reference: ${b.case?.reference ?? ""}`);
  lines.push(`- Claimant: ${b.case?.claimant ?? ""}`);
  lines.push(`- Respondent: ${b.case?.respondent ?? ""}`);
  lines.push(`- Tribunal: ${b.case?.tribunal ?? ""}`);
  lines.push("");
  lines.push("## Master Case Summary");
  lines.push(b.summary ?? "_No approved summary yet._");
  lines.push("");
  lines.push("## Issues Register");
  b.issues.forEach((i) =>
    lines.push(`- **${i.title}** [${i.status}] — Claimant: ${i.claimantPosition}; Respondent: ${i.respondentPosition}`),
  );
  lines.push("");
  lines.push("## Chronology");
  b.chronology.forEach((e) => lines.push(`- ${e.date}: ${e.title} (${e.statementType})`));
  lines.push("");
  lines.push("## Evidence Register");
  b.evidence.forEach((e) =>
    lines.push(`- ${e.description} [${e.statementType}${e.disputed ? ", disputed" : ""}]`),
  );
  lines.push("");
  lines.push("## Authorities Register");
  b.authorities.forEach((a) => lines.push(`- ${a.citation} — ${a.proposition}`));
  lines.push("");
  lines.push("## Document Index");
  b.documents.forEach((d) =>
    lines.push(`- ${d.fileName} (${d.sourceType}, doc date: ${d.documentDate ?? "n/a"})`),
  );
  return lines.join("\n");
}

async function buildWord(b: CaseBundle): Promise<Buffer> {
  const children: Paragraph[] = [];
  const h = (text: string) =>
    new Paragraph({ text, heading: HeadingLevel.HEADING_1 });
  const p = (text: string) => new Paragraph({ children: [new TextRun(text)] });

  children.push(
    new Paragraph({ text: `${b.case?.name ?? "Case"} — Case Report`, heading: HeadingLevel.TITLE }),
  );
  children.push(p(`Reference: ${b.case?.reference ?? ""}`));
  children.push(p(`Claimant: ${b.case?.claimant ?? ""}`));
  children.push(p(`Respondent: ${b.case?.respondent ?? ""}`));
  children.push(h("Master Case Summary"));
  children.push(p(b.summary ?? "No approved summary yet."));
  children.push(h("Issues Register"));
  b.issues.forEach((i) => children.push(p(`${i.title} [${i.status}]`)));
  children.push(h("Chronology"));
  b.chronology.forEach((e) => children.push(p(`${e.date}: ${e.title} (${e.statementType})`)));
  children.push(h("Authorities Register"));
  b.authorities.forEach((a) => children.push(p(`${a.citation} — ${a.proposition}`)));

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

function buildExcel(b: CaseBundle): Buffer {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      b.issues.map((i) => ({
        Title: i.title,
        Status: i.status,
        Claimant: i.claimantPosition,
        Respondent: i.respondentPosition,
      })),
    ),
    "Issues",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      b.chronology.map((e) => ({
        Date: e.date,
        Event: e.title,
        Type: e.statementType,
      })),
    ),
    "Chronology",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      b.documents.map((d) => ({
        File: d.fileName,
        SourceType: d.sourceType,
        DocumentDate: d.documentDate ?? "",
        UploadDate: d.uploadDate,
      })),
    ),
    "Documents",
  );
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export async function exportCase(
  caseId: string,
  format: ExportFormat,
): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
  const b = await gather(caseId);
  const base = (b.case?.reference || "case").replace(/[^a-z0-9]+/gi, "_");
  switch (format) {
    case "markdown":
      return {
        buffer: Buffer.from(buildMarkdown(b), "utf8"),
        contentType: "text/markdown",
        fileName: `${base}.md`,
      };
    case "json":
      return {
        buffer: Buffer.from(JSON.stringify(b, null, 2), "utf8"),
        contentType: "application/json",
        fileName: `${base}.json`,
      };
    case "excel":
      return {
        buffer: buildExcel(b),
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileName: `${base}.xlsx`,
      };
    case "word":
    default:
      return {
        buffer: await buildWord(b),
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileName: `${base}.docx`,
      };
  }
}
