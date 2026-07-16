/**
 * Seed a fictional Hong Kong construction arbitration demonstration case.
 *
 * No real confidential party names or case details are used. Run with:
 *   npm run seed
 */
import bcrypt from "bcryptjs";
import { mutate, __resetStoreForTests } from "@/lib/db/store";
import { createCase, createIssue, addMessage, addProposedMemory } from "@/lib/repo";
import { ingestDocument } from "@/lib/documents/ingest";
import { answerQuestion } from "@/lib/ai/chat";
import { newId, nowIso } from "@/lib/util";
import type { ChatMessage, ProposedMemoryUpdate } from "@/lib/types";

const DOCS: { name: string; sourceType: string; date: string; text: string }[] = [
  {
    name: "Contract.txt",
    sourceType: "contract",
    date: "2023-01-15",
    text: `MAIN CONTRACT — GreenHarbour Residential Development

Clause 12.1 The Completion Date for the Works shall be 30 June 2024.
Clause 12.2 The Contractor shall be entitled to an extension of time for any Relevant Event, including exceptionally adverse weather and variations instructed by the Architect.
Clause 14.3 If the Contractor fails to complete the Works by the Completion Date, the Architect shall issue a Non-Completion Certificate.
Clause 14.4 Liquidated damages shall be payable at HK$50,000 per day of delay following a valid Non-Completion Certificate.
Clause 20.2 Any Non-Completion Certificate must be issued in writing and must state the date by which the Works ought to have been completed.`,
  },
  {
    name: "Opening_Submission_Claimant.txt",
    sourceType: "pleading",
    date: "2026-02-01",
    text: `CLAIMANT'S OPENING SUBMISSION

The Claimant submits that the single operative Completion Date was 30 June 2024 as stated in Clause 12.1.
The Claimant alleges that the Non-Completion Certificate dated 10 July 2024 is invalid because it failed to state the date by which the Works ought to have been completed, contrary to Clause 20.2.
The Claimant contends it is entitled to an extension of time of 45 days for exceptionally adverse weather in April 2024.
Accordingly, the Claimant says no liquidated damages are payable.`,
  },
  {
    name: "Defence_and_Counterclaim.txt",
    sourceType: "pleading",
    date: "2026-02-20",
    text: `DEFENCE AND COUNTERCLAIM

The Respondent denies that the Non-Completion Certificate is invalid. The Respondent contends the certificate dated 10 July 2024 substantially complied with Clause 20.2.
However, the Respondent accepts that the certificate did not expressly restate the Completion Date.
The Respondent disputes the extension of time claim, asserting the April 2024 weather was not exceptionally adverse.
The Respondent counterclaims liquidated damages of HK$50,000 per day from 1 July 2024.`,
  },
  {
    name: "NCC_Notice_10July2024.txt",
    sourceType: "certificate",
    date: "2024-07-10",
    text: `NON-COMPLETION CERTIFICATE

To: The Contractor
The Architect hereby certifies that the Works have not been completed.
This certificate is issued under Clause 14.3 of the Contract.
[Note: this certificate does not restate the date by which the Works ought to have been completed.]`,
  },
  {
    name: "Weather_Report_April2024.csv",
    sourceType: "expert_report",
    date: "2024-05-02",
    text: `[Sheet: April 2024 Rainfall]
Date,Rainfall_mm,Notes
2024-04-08,142,Black rainstorm warning issued
2024-04-09,98,Amber rainstorm warning
2024-04-15,55,Heavy showers
Total April rainfall was 61% above the 30-year average, however site records show work continued on 20 of 30 days.`,
  },
  {
    name: "Witness_Statement_Chan.txt",
    sourceType: "witness_statement",
    date: "2026-03-05",
    text: `WITNESS STATEMENT OF MR CHAN (Project Manager, Claimant)

I confirm that heavy rain in April 2024 prevented concrete pours on at least 12 working days.
In my opinion the delay caused by the weather was approximately 45 days.
I received the Non-Completion Certificate on 10 July 2024 and noted it did not state any completion date.`,
  },
];

async function main() {
  await __resetStoreForTests();

  const adminId = newId("user");
  const consultantId = newId("user");
  const adminHash = await bcrypt.hash("demo1234", 10);
  await mutate((db) => {
    db.users.push({
      id: adminId,
      email: "admin@kmclaim.test",
      name: "Alex Wong",
      role: "administrator",
      passwordHash: adminHash,
      createdAt: nowIso(),
    });
    db.users.push({
      id: consultantId,
      email: "consultant@kmclaim.test",
      name: "Jamie Lee",
      role: "claim_consultant",
      passwordHash: adminHash,
      createdAt: nowIso(),
    });
  });

  const kase = await createCase({
    name: "GreenHarbour Residential v Apex Construction",
    reference: "HKIAC/2026/017",
    claimant: "GreenHarbour Residential Ltd",
    respondent: "Apex Construction Co Ltd",
    tribunal: "HKIAC (construction arbitration)",
    description:
      "Dispute over the validity of a Non-Completion Certificate, an extension-of-time claim for April 2024 weather, and liquidated damages. Fictional demonstration data only.",
    createdBy: adminId,
  });

  for (const d of DOCS) {
    await ingestDocument({
      caseId: kase.id,
      fileName: d.name,
      buffer: Buffer.from(d.text, "utf8"),
      userId: adminId,
      documentDate: d.date,
      sourceType: d.sourceType as never,
    });
  }

  await createIssue(
    kase.id,
    {
      title: "Single operative Completion Date (30 June 2024)",
      claimantPosition: "The sole Completion Date is 30 June 2024 (Clause 12.1).",
      respondentPosition: "Accepted, subject to liquidated damages from 1 July 2024.",
    },
    adminId,
  );
  await createIssue(
    kase.id,
    {
      title: "Validity of the Non-Completion Certificate (10 July 2024)",
      claimantPosition: "Invalid — failed to state the completion date (Clause 20.2).",
      respondentPosition: "Valid — substantially complied with Clause 20.2.",
    },
    adminId,
  );
  await createIssue(
    kase.id,
    {
      title: "Extension of time for April 2024 weather (45 days claimed)",
      claimantPosition: "45-day EOT for exceptionally adverse weather (Clause 12.2).",
      respondentPosition: "Weather not exceptionally adverse; work continued 20/30 days.",
    },
    adminId,
  );

  await mutate((db) => {
    db.chronology_events.push(
      {
        id: newId("chron"), caseId: kase.id, date: "2023-01-15",
        title: "Main Contract executed", description: "Completion Date fixed at 30 June 2024 (Cl 12.1).",
        statementType: "fact", sourceDocumentId: null, sourcePage: 1, createdAt: nowIso(),
      },
      {
        id: newId("chron"), caseId: kase.id, date: "2024-04-08",
        title: "Black rainstorm warning", description: "142mm rainfall; alleged basis for EOT.",
        statementType: "allegation", sourceDocumentId: null, sourcePage: 1, createdAt: nowIso(),
      },
      {
        id: newId("chron"), caseId: kase.id, date: "2024-07-10",
        title: "Non-Completion Certificate issued", description: "Certificate did not restate completion date.",
        statementType: "fact", sourceDocumentId: null, sourcePage: 1, createdAt: nowIso(),
      },
    );
    db.authorities.push({
      id: newId("auth"), caseId: kase.id,
      citation: "Token Construction v Charlton Estates (1973) 1 BLR 48",
      proposition: "A certificate must comply with the contractual formalities to be valid.",
      relevance: "Supports the Claimant's challenge to the Non-Completion Certificate.",
      createdAt: nowIso(),
    });
    db.witnesses.push({
      id: newId("wit"), caseId: kase.id, name: "Mr Chan", party: "claimant",
      role: "Project Manager", summary: "Speaks to weather delay and receipt of the NCC.",
      createdAt: nowIso(),
    });
    db.evidence_items.push({
      id: newId("ev"), caseId: kase.id,
      description: "Site records show work continued on 20 of 30 days in April 2024.",
      statementType: "fact", documentId: null, page: 1, disputed: true, createdAt: nowIso(),
    });
  });

  // Seed one AI answer with citations + a resulting proposed memory update.
  const question = "Is the Non-Completion Certificate dated 10 July 2024 valid?";
  const answer = await answerQuestion(kase.id, question);
  const chatId = newId("chat");
  await mutate((db) => {
    db.chats.push({ id: chatId, caseId: kase.id, title: question.slice(0, 60), createdAt: nowIso() });
  });
  const userMsg: ChatMessage = {
    id: newId("msg"), chatId, caseId: kase.id, role: "user",
    content: question, structured: null, createdAt: nowIso(),
  };
  const assistantMsg: ChatMessage = {
    id: newId("msg"), chatId, caseId: kase.id, role: "assistant",
    content: answer.answer, structured: answer, createdAt: nowIso(),
  };
  await addMessage(userMsg);
  await addMessage(assistantMsg);
  for (const s of answer.suggestedMemoryUpdates) {
    const p: ProposedMemoryUpdate = {
      id: newId("pmu"), caseId: kase.id, chatId, messageId: assistantMsg.id,
      target: s.target, action: s.action, summary: s.summary, content: s.content,
      status: "proposed", createdAt: nowIso(), reviewedBy: null, reviewedAt: null,
    };
    await addProposedMemory(p);
  }

  console.log("Seed complete.");
  console.log(`  Case: ${kase.name} (${kase.id})`);
  console.log("  Login: admin@kmclaim.test / demo1234");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
