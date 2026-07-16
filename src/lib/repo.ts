import { getDb, mutate } from "@/lib/db/store";
import { newId, nowIso } from "@/lib/util";
import type {
  ApprovedMemoryUpdate,
  Authority,
  AuditLog,
  Case,
  Chat,
  ChatMessage,
  ChronologyEvent,
  DocumentChunk,
  DocumentPage,
  DocumentRecord,
  DocumentVersion,
  EvidenceItem,
  ExportRecord,
  Issue,
  IssueVersion,
  MemoryTarget,
  ProposedMemoryUpdate,
  RetrievalLog,
  SummaryVersion,
  Task,
  User,
  Witness,
} from "@/lib/types";

// All read helpers here are explicitly scoped by caseId. This is the primary
// guard against cross-case data leakage (data-integrity rule 5.9 and the
// security requirement). Callers must pass the caseId they are authorised for.

// ---- audit ----
export async function addAudit(
  caseId: string | null,
  userId: string | null,
  action: string,
  detail: string,
): Promise<void> {
  await mutate((db) => {
    const entry: AuditLog = {
      id: newId("audit"),
      caseId,
      userId,
      action,
      detail,
      createdAt: nowIso(),
    };
    db.audit_logs.push(entry);
  });
}

export async function listAudit(caseId: string): Promise<AuditLog[]> {
  const db = await getDb();
  return db.audit_logs
    .filter((a) => a.caseId === caseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ---- users ----
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = await getDb();
  return db.users.find((u) => u.id === id);
}

// ---- cases ----
export async function listCases(): Promise<Case[]> {
  const db = await getDb();
  return [...db.cases].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getCase(caseId: string): Promise<Case | undefined> {
  const db = await getDb();
  return db.cases.find((c) => c.id === caseId);
}

export async function createCase(
  input: Omit<Case, "id" | "createdAt" | "updatedAt">,
): Promise<Case> {
  return mutate((db) => {
    const c: Case = {
      ...input,
      id: newId("case"),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.cases.push(c);
    db.master_case_summaries.push({
      id: newId("mcs"),
      caseId: c.id,
      currentVersionId: null,
      updatedAt: nowIso(),
    });
    return c;
  });
}

// ---- documents ----
export async function listDocuments(caseId: string): Promise<DocumentRecord[]> {
  const db = await getDb();
  return db.documents
    .filter((d) => d.caseId === caseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getDocument(
  caseId: string,
  docId: string,
): Promise<DocumentRecord | undefined> {
  const db = await getDb();
  return db.documents.find((d) => d.id === docId && d.caseId === caseId);
}

export async function getDocumentVersions(
  caseId: string,
  documentId: string,
): Promise<DocumentVersion[]> {
  const db = await getDb();
  return db.document_versions
    .filter((v) => v.caseId === caseId && v.documentId === documentId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

export async function getDocumentPages(
  caseId: string,
  documentId: string,
): Promise<DocumentPage[]> {
  const db = await getDb();
  return db.document_pages
    .filter((p) => p.caseId === caseId && p.documentId === documentId)
    .sort((a, b) => a.pageNumber - b.pageNumber);
}

export async function listChunks(caseId: string): Promise<DocumentChunk[]> {
  const db = await getDb();
  return db.document_chunks.filter((c) => c.caseId === caseId);
}

// ---- issues ----
export async function listIssues(caseId: string): Promise<Issue[]> {
  const db = await getDb();
  return db.issues
    .filter((i) => i.caseId === caseId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getIssue(
  caseId: string,
  issueId: string,
): Promise<Issue | undefined> {
  const db = await getDb();
  return db.issues.find((i) => i.id === issueId && i.caseId === caseId);
}

export async function getIssueVersions(
  caseId: string,
  issueId: string,
): Promise<IssueVersion[]> {
  const db = await getDb();
  return db.issue_versions
    .filter((v) => v.caseId === caseId && v.issueId === issueId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

export async function createIssue(
  caseId: string,
  input: { title: string; claimantPosition: string; respondentPosition: string },
  userId: string,
): Promise<Issue> {
  return mutate((db) => {
    const issue: Issue = {
      id: newId("issue"),
      caseId,
      title: input.title,
      status: "open",
      claimantPosition: input.claimantPosition,
      respondentPosition: input.respondentPosition,
      currentVersionId: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.issues.push(issue);
    db.audit_logs.push({
      id: newId("audit"),
      caseId,
      userId,
      action: "issue.create",
      detail: `Created issue "${input.title}"`,
      createdAt: nowIso(),
    });
    return issue;
  });
}

// ---- chronology ----
export async function listChronology(caseId: string): Promise<ChronologyEvent[]> {
  const db = await getDb();
  return db.chronology_events
    .filter((e) => e.caseId === caseId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ---- evidence / authorities / witnesses ----
export async function listEvidence(caseId: string): Promise<EvidenceItem[]> {
  const db = await getDb();
  return db.evidence_items.filter((e) => e.caseId === caseId);
}

export async function listAuthorities(caseId: string): Promise<Authority[]> {
  const db = await getDb();
  return db.authorities.filter((a) => a.caseId === caseId);
}

export async function listWitnesses(caseId: string): Promise<Witness[]> {
  const db = await getDb();
  return db.witnesses.filter((w) => w.caseId === caseId);
}

export async function listTasks(caseId: string): Promise<Task[]> {
  const db = await getDb();
  return db.tasks.filter((t) => t.caseId === caseId);
}

// ---- master case summary ----
export async function getMasterSummary(caseId: string): Promise<{
  currentVersion: SummaryVersion | null;
  versions: SummaryVersion[];
}> {
  const db = await getDb();
  const summary = db.master_case_summaries.find((s) => s.caseId === caseId);
  const versions = db.summary_versions
    .filter((v) => v.caseId === caseId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
  const currentVersion =
    versions.find((v) => v.id === summary?.currentVersionId) ?? null;
  return { currentVersion, versions };
}

// ---- chats ----
export async function listChats(caseId: string): Promise<Chat[]> {
  const db = await getDb();
  return db.chats
    .filter((c) => c.caseId === caseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getChat(
  caseId: string,
  chatId: string,
): Promise<Chat | undefined> {
  const db = await getDb();
  return db.chats.find((c) => c.id === chatId && c.caseId === caseId);
}

export async function createChat(caseId: string, title: string): Promise<Chat> {
  return mutate((db) => {
    const chat: Chat = {
      id: newId("chat"),
      caseId,
      title,
      createdAt: nowIso(),
    };
    db.chats.push(chat);
    return chat;
  });
}

export async function listMessages(
  caseId: string,
  chatId: string,
): Promise<ChatMessage[]> {
  const db = await getDb();
  return db.chat_messages
    .filter((m) => m.caseId === caseId && m.chatId === chatId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addMessage(msg: ChatMessage): Promise<void> {
  await mutate((db) => {
    db.chat_messages.push(msg);
  });
}

export async function addRetrievalLog(log: RetrievalLog): Promise<void> {
  await mutate((db) => {
    db.retrieval_logs.push(log);
  });
}

// ---- memory updates ----
export async function listProposedMemory(
  caseId: string,
): Promise<ProposedMemoryUpdate[]> {
  const db = await getDb();
  return db.proposed_memory_updates
    .filter((p) => p.caseId === caseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addProposedMemory(
  update: ProposedMemoryUpdate,
): Promise<void> {
  await mutate((db) => {
    db.proposed_memory_updates.push(update);
  });
}

// Approve a proposed memory update. This is the ONLY path that mutates approved
// case memory, and it always writes an audit entry + preserves version history.
export async function approveMemory(
  caseId: string,
  proposedId: string,
  userId: string,
  editedContent?: string,
): Promise<ApprovedMemoryUpdate | null> {
  return mutate((db) => {
    const proposed = db.proposed_memory_updates.find(
      (p) => p.id === proposedId && p.caseId === caseId,
    );
    if (!proposed) return null;
    const content = editedContent ?? proposed.content;
    proposed.status = "approved";
    proposed.reviewedBy = userId;
    proposed.reviewedAt = nowIso();
    if (editedContent !== undefined) proposed.content = editedContent;

    const approved: ApprovedMemoryUpdate = {
      id: newId("appr"),
      caseId,
      proposedId,
      target: proposed.target,
      content,
      approvedBy: userId,
      approvedAt: nowIso(),
    };
    db.approved_memory_updates.push(approved);

    applyApprovedMemory(db, caseId, proposed.target, content, userId);

    db.audit_logs.push({
      id: newId("audit"),
      caseId,
      userId,
      action: "memory.approve",
      detail: `Approved ${proposed.target}: ${proposed.summary}`,
      createdAt: nowIso(),
    });
    return approved;
  });
}

export async function reviewMemory(
  caseId: string,
  proposedId: string,
  userId: string,
  status: "rejected" | "deferred",
): Promise<boolean> {
  return mutate((db) => {
    const proposed = db.proposed_memory_updates.find(
      (p) => p.id === proposedId && p.caseId === caseId,
    );
    if (!proposed) return false;
    proposed.status = status;
    proposed.reviewedBy = userId;
    proposed.reviewedAt = nowIso();
    db.audit_logs.push({
      id: newId("audit"),
      caseId,
      userId,
      action: `memory.${status}`,
      detail: `${status} ${proposed.target}: ${proposed.summary}`,
      createdAt: nowIso(),
    });
    return true;
  });
}

// Materialise an approved memory update into the live registers. Old data is
// never destroyed silently: summaries/issues create new versions, and other
// registers append records.
function applyApprovedMemory(
  db: import("@/lib/types").Database,
  caseId: string,
  target: MemoryTarget,
  content: string,
  userId: string,
): void {
  if (target === "master_case_summary") {
    const summary = db.master_case_summaries.find((s) => s.caseId === caseId);
    if (!summary) return;
    const versionNumber =
      db.summary_versions.filter((v) => v.caseId === caseId).length + 1;
    const version: SummaryVersion = {
      id: newId("sv"),
      summaryId: summary.id,
      caseId,
      versionNumber,
      content,
      createdBy: userId,
      createdAt: nowIso(),
    };
    db.summary_versions.push(version);
    summary.currentVersionId = version.id;
    summary.updatedAt = nowIso();
  } else if (target === "chronology") {
    db.chronology_events.push({
      id: newId("chron"),
      caseId,
      date: nowIso().slice(0, 10),
      title: content.slice(0, 80),
      description: content,
      statementType: "ai_generated",
      sourceDocumentId: null,
      sourcePage: null,
      createdAt: nowIso(),
    });
  } else if (target === "outstanding_questions" || target === "task_list") {
    db.tasks.push({
      id: newId("task"),
      caseId,
      title: content.slice(0, 140),
      status: "open",
      createdAt: nowIso(),
    });
  } else if (target === "evidence_register") {
    db.evidence_items.push({
      id: newId("ev"),
      caseId,
      description: content,
      statementType: "ai_generated",
      documentId: null,
      page: null,
      disputed: false,
      createdAt: nowIso(),
    });
  } else if (target === "authorities_register") {
    db.authorities.push({
      id: newId("auth"),
      caseId,
      citation: content.slice(0, 120),
      proposition: content,
      relevance: "",
      createdAt: nowIso(),
    });
  }
  // issues_register / parties_positions / witness_records are surfaced in the
  // approved-memory audit trail and Master Summary; structured edits to those
  // registers are made through their own screens.
}

// ---- exports ----
export async function recordExport(rec: ExportRecord): Promise<void> {
  await mutate((db) => {
    db.exports.push(rec);
  });
}
