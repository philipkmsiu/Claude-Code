"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UploadForm({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setMsg("Please choose a file.");
      return;
    }
    setBusy(true);
    setMsg("Extracting text, chunking and embedding…");
    try {
      const res = await fetch(`/api/cases/${caseId}/documents`, {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(`Error: ${json.error ?? "upload failed"}`);
      } else {
        setMsg(
          `Ingested: ${json.pages} page(s), ${json.chunks} chunk(s)${json.duplicate ? " (duplicate content detected)" : ""}.`,
        );
        form.reset();
        router.refresh();
      }
    } catch {
      setMsg("Network error during upload.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="file">Document file (PDF, DOCX, XLSX, TXT, MD)</label>
          <input id="file" name="file" type="file" className="input" accept=".pdf,.docx,.xlsx,.xls,.txt,.md,.csv" />
        </div>
        <div>
          <label className="label" htmlFor="sourceType">Source type</label>
          <select id="sourceType" name="sourceType" className="select" defaultValue="">
            <option value="">Auto-detect</option>
            <option value="contract">Contract</option>
            <option value="pleading">Pleading</option>
            <option value="correspondence">Correspondence</option>
            <option value="witness_statement">Witness statement</option>
            <option value="expert_report">Expert report</option>
            <option value="authority">Authority</option>
            <option value="certificate">Certificate</option>
            <option value="drawing">Drawing</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="documentDate">Document date (as shown on the document)</label>
          <input id="documentDate" name="documentDate" type="date" className="input" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Uploading…" : "Upload & ingest"}
        </button>
        {msg && <span className="text-[13px] text-[color:var(--muted)]">{msg}</span>}
      </div>
    </form>
  );
}
