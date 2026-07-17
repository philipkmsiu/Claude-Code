/**
 * Bulk-import a folder of case documents into a case.
 *
 * Usage:
 *   npm run import -- <folderPath> "<Case name>"
 *
 * - Recursively scans <folderPath> for supported files
 *   (.pdf .docx .xlsx .xls .csv .txt .md).
 * - If a case with the given name exists it is reused; otherwise it is created.
 * - Each file is extracted, chunked and embedded (OpenAI if OPENAI_API_KEY is
 *   set, otherwise the offline local fallback).
 */
import { promises as fs } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { getDb, mutate } from "@/lib/db/store";
import { listCases, createCase } from "@/lib/repo";
import { ingestDocument } from "@/lib/documents/ingest";
import { newId, nowIso } from "@/lib/util";
import type { User } from "@/lib/types";

const SUPPORTED = new Set([".pdf", ".docx", ".xlsx", ".xls", ".csv", ".txt", ".md"]);

async function ensureUser(): Promise<string> {
  const db = await getDb();
  const existing = db.users[0];
  if (existing) return existing.id;
  // No users yet (e.g. never seeded): create a minimal importer account.
  const id = newId("user");
  const hash = await bcrypt.hash("demo1234", 10);
  await mutate((d) => {
    const u: User = {
      id,
      email: "admin@kmclaim.test",
      name: "Alex Wong",
      role: "administrator",
      passwordHash: hash,
      createdAt: nowIso(),
    };
    d.users.push(u);
  });
  return id;
}

async function resolveCase(caseName: string, userId: string): Promise<string> {
  const cases = await listCases();
  const match = cases.find(
    (c) => c.name.toLowerCase() === caseName.toLowerCase(),
  );
  if (match) return match.id;
  const created = await createCase({
    name: caseName,
    reference: "",
    claimant: "",
    respondent: "",
    tribunal: "",
    description: `Imported via bulk importer on ${nowIso()}.`,
    createdBy: userId,
  });
  return created.id;
}

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true, recursive: true });
  const files: string[] = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const full = path.join(
      // Node's recursive readdir sets parentPath (Node >=20.12); fall back to dir.
      (e as unknown as { parentPath?: string }).parentPath ?? dir,
      e.name,
    );
    if (SUPPORTED.has(path.extname(e.name).toLowerCase())) files.push(full);
  }
  return files.sort();
}

async function main() {
  const [folder, ...nameParts] = process.argv.slice(2);
  const caseName = nameParts.join(" ").trim();
  if (!folder || !caseName) {
    console.error('Usage: npm run import -- <folderPath> "<Case name>"');
    process.exit(1);
  }

  const abs = path.resolve(folder);
  const stat = await fs.stat(abs).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    console.error(`Not a directory: ${abs}`);
    process.exit(1);
  }

  const userId = await ensureUser();
  const caseId = await resolveCase(caseName, userId);
  const files = await collectFiles(abs);

  if (files.length === 0) {
    console.log(`No supported files (${[...SUPPORTED].join(", ")}) found in ${abs}`);
    process.exit(0);
  }

  console.log(`Importing ${files.length} file(s) into case "${caseName}" (${caseId})…\n`);
  let ok = 0;
  let failed = 0;
  for (const file of files) {
    const rel = path.relative(abs, file);
    try {
      const buffer = await fs.readFile(file);
      const res = await ingestDocument({
        caseId,
        fileName: path.basename(file),
        buffer,
        userId,
      });
      ok++;
      console.log(
        `  ✓ ${rel}  →  ${res.pages} page(s), ${res.chunks} chunk(s)${res.duplicate ? " [duplicate]" : ""}`,
      );
    } catch (err) {
      failed++;
      console.log(`  ✗ ${rel}  →  ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  console.log(`\nDone. Imported ${ok} file(s), ${failed} failed.`);
  console.log(`Open the app → case "${caseName}" → Documents to review, then ask questions in AI Chat.`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
