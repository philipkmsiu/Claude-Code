import ChatPanel from "@/components/ChatPanel";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Case AI Chat</h1>
      <p className="text-[13px] text-[color:var(--muted)] mb-5">
        Grounded, source-cited answers with contrary-evidence surfacing and proposed memory updates.
      </p>
      <ChatPanel caseId={caseId} />
    </div>
  );
}
