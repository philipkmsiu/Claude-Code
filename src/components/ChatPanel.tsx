"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { AiStructuredAnswer, ChatMessage } from "@/lib/types";

interface Turn {
  role: "user" | "assistant";
  content: string;
  structured: AiStructuredAnswer | null;
}

export default function ChatPanel({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [chatId, setChatId] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function ask(question: string) {
    setTurns((t) => [...t, { role: "user", content: question, structured: null }]);
    setBusy(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, chatId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setTurns((t) => [...t, { role: "assistant", content: `Error: ${json.error}`, structured: null }]);
      } else {
        const msg = json.message as ChatMessage;
        setChatId(json.chatId);
        setTurns((t) => [...t, { role: "assistant", content: msg.content, structured: msg.structured }]);
        router.refresh(); // refresh sidebar pending-memory badge
      }
    } catch {
      setTurns((t) => [...t, { role: "assistant", content: "Network error.", structured: null }]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (!q || busy) return;
    if (inputRef.current) inputRef.current.value = "";
    void ask(q);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-4">
        {turns.length === 0 && (
          <div className="card p-6 text-[13px] text-[color:var(--muted)]">
            Ask a grounded question about this case. Answers are constrained to retrieved
            source passages and approved memory, with citations, contrary evidence and
            confidence.
          </div>
        )}
        {turns.map((t, i) =>
          t.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="bg-[color:var(--primary)] text-white rounded-lg px-4 py-2 text-[13px] max-w-[80%]">
                {t.content}
              </div>
            </div>
          ) : (
            <AnswerCard key={i} content={t.content} s={t.structured} />
          ),
        )}
        {busy && <div className="text-[13px] text-[color:var(--muted)]">Retrieving and analysing…</div>}
      </div>

      <form onSubmit={onSubmit} className="card p-3 sticky bottom-4">
        <textarea
          ref={inputRef}
          className="textarea"
          rows={2}
          placeholder="e.g. Is the Non-Completion Certificate valid?"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-[11px] text-[color:var(--muted)]">Enter to send · Shift+Enter for newline</span>
          <button type="submit" className="btn btn-primary" disabled={busy}>Ask</button>
        </div>
      </form>
    </div>
  );
}

function AnswerCard({ content, s }: { content: string; s: AiStructuredAnswer | null }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="type-tag">{s?.statementType?.replace(/_/g, " ") ?? "answer"}</span>
        {s && (
          <span className="badge">
            confidence {Math.round((s.confidence ?? 0) * 100)}%
          </span>
        )}
        {s && <span className="badge">{s.usedModel}</span>}
      </div>
      <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{content}</p>

      {s && s.contraryEvidence.length > 0 && (
        <div className="banner-warning mt-3">
          <div className="font-semibold text-[12px] mb-1">Contrary / adverse evidence</div>
          <ul className="list-disc pl-5 text-[12px] space-y-1">
            {s.contraryEvidence.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}

      {s && s.uncertainties.length > 0 && (
        <div className="mt-3">
          <div className="label">Uncertainties</div>
          <ul className="list-disc pl-5 text-[12px] text-[color:var(--muted)] space-y-1">
            {s.uncertainties.map((u, i) => <li key={i}>{u}</li>)}
          </ul>
        </div>
      )}

      {s && s.citations.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[12px] font-semibold text-[color:var(--primary)]">
            Source citations ({s.citations.length})
          </summary>
          <ul className="mt-2 space-y-2">
            {s.citations.map((c, i) => (
              <li key={i} className="text-[12px] border-l-2 pl-3" style={{ borderColor: "var(--accent)" }}>
                <span className="font-medium">{c.fileName}</span>
                {c.page != null && <> · p.{c.page}</>}
                {c.paragraph != null && <> · ¶{c.paragraph}</>}
                {c.clause && <> · cl.{c.clause}</>}
                <div className="text-[color:var(--muted)] mt-1">“{c.quote}”</div>
              </li>
            ))}
          </ul>
        </details>
      )}

      {s && s.suggestedMemoryUpdates.length > 0 && (
        <div className="mt-3 text-[12px] text-[color:var(--muted)]">
          Proposed {s.suggestedMemoryUpdates.length} memory update(s) — review in Memory Review.
        </div>
      )}
    </div>
  );
}
