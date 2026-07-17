"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { seg: "", label: "Dashboard" },
  { seg: "documents", label: "Documents" },
  { seg: "issues", label: "Issues" },
  { seg: "chronology", label: "Chronology" },
  { seg: "summary", label: "Master Summary" },
  { seg: "chat", label: "AI Chat" },
  { seg: "graph", label: "Knowledge Graph" },
  { seg: "memory", label: "Memory Review" },
  { seg: "audit", label: "Audit History" },
];

export default function CaseNav({ caseId }: { caseId: string }) {
  const pathname = usePathname();
  const base = `/cases/${caseId}`;
  return (
    <nav className="flex flex-col gap-1">
      {items.map((it) => {
        const href = it.seg ? `${base}/${it.seg}` : base;
        const active =
          it.seg === ""
            ? pathname === base
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={it.seg}
            href={href}
            className={`px-3 py-2 rounded-md text-[13px] ${
              active
                ? "bg-[color:var(--primary)] text-white font-medium"
                : "text-[color:var(--foreground)] hover:bg-[color:var(--surface-2)]"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
