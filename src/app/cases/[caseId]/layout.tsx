import Link from "next/link";
import TopBar from "@/components/TopBar";
import CaseNav from "@/components/CaseNav";
import { guardCase } from "@/lib/guard";
import { listProposedMemory } from "@/lib/repo";

export default async function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const { case: c } = await guardCase(caseId);
  const pending = (await listProposedMemory(caseId)).filter(
    (p) => p.status === "proposed",
  ).length;

  return (
    <div className="flex-1 flex flex-col">
      <TopBar />
      <div className="max-w-[1400px] mx-auto w-full px-5 py-6 flex gap-6">
        <aside className="w-56 shrink-0">
          <div className="mb-4">
            <Link href="/cases" className="text-[12px] text-[color:var(--muted)] hover:underline">
              ← All cases
            </Link>
            <h2 className="font-semibold mt-1 leading-tight">{c.name}</h2>
            <p className="text-[12px] text-[color:var(--muted)]">{c.reference}</p>
          </div>
          <CaseNav caseId={caseId} />
          {pending > 0 && (
            <div className="mt-4 banner-warning text-[12px]">
              {pending} memory update{pending === 1 ? "" : "s"} awaiting review
            </div>
          )}
        </aside>
        <section className="flex-1 min-w-0">{children}</section>
      </div>
    </div>
  );
}
