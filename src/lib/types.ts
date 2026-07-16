// Core domain types for KM Claim OS.
// These mirror the database schema (see database-schema.md) and are shared by
// the local development store and the (future) Supabase adapter.

export type UserRole =
  | "administrator"
  | "claim_consultant"
  | "solicitor"
  | "counsel"
  | "expert"
  | "client"
  | "read_only_reviewer";

// The controlled vocabulary the AI and UI use to label the epistemic status of
// a statement. Required by the data-integrity rules (section 7 of the spec).
export type StatementType =
  | "fact"
  | "allegation"
  | "inference"
  | "legal_submission"
  | "expert_opinion"
  | "user_instruction"
  | "ai_generated"
  | "unverified";

export type SourceType =
  | "contract"
  | "pleading"
  | "correspondence"
  | "witness_statement"
  | "expert_report"
  | "authority"
  | "drawing"
  | "certificate"
  | "other";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
}

export interface Case {
  id: string;
  name: string;
  reference: string;
  claimant: string;
  respondent: string;
  tribunal: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseMember {
  id: string;
  caseId: string;
  userId: string;
  role: UserRole;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  caseId: string;
  fileName: string;
  title: string;
  sourceType: SourceType;
  documentDate: string | null; // date shown on the document itself
  uploadDate: string; // when it entered the system
  currentVersionId: string;
  supersededByDocumentId: string | null;
  createdBy: string;
  createdAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  caseId: string;
  versionNumber: number;
  fileName: string;
  hash: string; // sha256 of raw content, used for duplicate detection
  byteLength: number;
  extractionConfidence: number; // 0..1
  createdAt: string;
}

export interface DocumentPage {
  id: string;
  documentId: string;
  versionId: string;
  caseId: string;
  pageNumber: number;
  text: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  versionId: string;
  caseId: string;
  // parent-child chunking: a parent chunk preserves surrounding context, child
  // chunks are the precise passages that get embedded / retrieved.
  parentId: string | null;
  isParent: boolean;
  pageNumber: number | null;
  paragraphNumber: number | null;
  clauseNumber: string | null;
  heading: string | null;
  sourceType: SourceType;
  text: string;
  embedding: number[];
  createdAt: string;
}

export interface Issue {
  id: string;
  caseId: string;
  title: string;
  status: "open" | "in_progress" | "resolved" | "abandoned";
  claimantPosition: string;
  respondentPosition: string;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IssueVersion {
  id: string;
  issueId: string;
  caseId: string;
  versionNumber: number;
  analysis: string;
  createdBy: string;
  createdAt: string;
}

export interface MasterCaseSummary {
  id: string;
  caseId: string;
  currentVersionId: string | null;
  updatedAt: string;
}

export interface SummaryVersion {
  id: string;
  summaryId: string;
  caseId: string;
  versionNumber: number;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface ChronologyEvent {
  id: string;
  caseId: string;
  date: string;
  title: string;
  description: string;
  statementType: StatementType;
  sourceDocumentId: string | null;
  sourcePage: number | null;
  createdAt: string;
}

export interface EvidenceItem {
  id: string;
  caseId: string;
  description: string;
  statementType: StatementType;
  documentId: string | null;
  page: number | null;
  disputed: boolean;
  createdAt: string;
}

export interface Authority {
  id: string;
  caseId: string;
  citation: string;
  proposition: string;
  relevance: string;
  createdAt: string;
}

export interface Witness {
  id: string;
  caseId: string;
  name: string;
  party: "claimant" | "respondent" | "tribunal" | "other";
  role: string;
  summary: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  caseId: string;
  title: string;
  createdAt: string;
}

export interface Citation {
  documentId: string | null;
  fileName: string;
  page: number | null;
  paragraph: number | null;
  clause: string | null;
  quote: string;
}

export interface SuggestedMemoryUpdate {
  target: MemoryTarget;
  action: "add" | "update";
  summary: string;
  content: string;
}

export interface AiStructuredAnswer {
  answer: string;
  statementType: StatementType;
  citations: Citation[];
  memoryRecordsUsed: string[];
  retrievedChunkIds: string[];
  uncertainties: string[];
  contraryEvidence: string[];
  suggestedMemoryUpdates: SuggestedMemoryUpdate[];
  confidence: number; // 0..1
  usedModel: string; // "openai:<model>" or "local-fallback"
}

export interface ChatMessage {
  id: string;
  chatId: string;
  caseId: string;
  role: "user" | "assistant";
  content: string;
  structured: AiStructuredAnswer | null;
  createdAt: string;
}

export interface RetrievalLog {
  id: string;
  caseId: string;
  chatId: string | null;
  query: string;
  retrievedChunkIds: string[];
  scores: number[];
  createdAt: string;
}

export type MemoryTarget =
  | "master_case_summary"
  | "chronology"
  | "issues_register"
  | "parties_positions"
  | "evidence_register"
  | "authorities_register"
  | "witness_records"
  | "outstanding_questions"
  | "task_list";

export type MemoryUpdateStatus =
  | "proposed"
  | "approved"
  | "rejected"
  | "deferred";

export interface ProposedMemoryUpdate {
  id: string;
  caseId: string;
  chatId: string | null;
  messageId: string | null;
  target: MemoryTarget;
  action: "add" | "update";
  summary: string;
  content: string;
  status: MemoryUpdateStatus;
  createdAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface ApprovedMemoryUpdate {
  id: string;
  caseId: string;
  proposedId: string;
  target: MemoryTarget;
  content: string;
  approvedBy: string;
  approvedAt: string;
}

export interface Task {
  id: string;
  caseId: string;
  title: string;
  status: "open" | "done";
  createdAt: string;
}

export interface AuditLog {
  id: string;
  caseId: string | null;
  userId: string | null;
  action: string;
  detail: string;
  createdAt: string;
}

export interface ExportRecord {
  id: string;
  caseId: string;
  format: "word" | "excel" | "markdown" | "json";
  kind: string;
  createdBy: string;
  createdAt: string;
}

export interface Database {
  users: User[];
  cases: Case[];
  case_members: CaseMember[];
  documents: DocumentRecord[];
  document_versions: DocumentVersion[];
  document_pages: DocumentPage[];
  document_chunks: DocumentChunk[];
  issues: Issue[];
  issue_versions: IssueVersion[];
  master_case_summaries: MasterCaseSummary[];
  summary_versions: SummaryVersion[];
  chronology_events: ChronologyEvent[];
  evidence_items: EvidenceItem[];
  authorities: Authority[];
  witnesses: Witness[];
  chats: Chat[];
  chat_messages: ChatMessage[];
  retrieval_logs: RetrievalLog[];
  proposed_memory_updates: ProposedMemoryUpdate[];
  approved_memory_updates: ApprovedMemoryUpdate[];
  tasks: Task[];
  audit_logs: AuditLog[];
  exports: ExportRecord[];
}

export type TableName = keyof Database;
