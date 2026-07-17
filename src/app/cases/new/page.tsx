import Link from "next/link";
import { createCaseAction } from "@/app/actions/cases";

export default function NewCasePage() {
  return (
    <div className="max-w-[720px] mx-auto px-5 py-8">
      <Link href="/cases" className="text-[13px] text-[color:var(--muted)] hover:underline">
        ← Cases
      </Link>
      <h1 className="text-xl font-semibold mt-2 mb-6">Create case</h1>
      <form action={createCaseAction} className="card p-6 space-y-4">
        <div>
          <label className="label" htmlFor="name">Case name</label>
          <input id="name" name="name" className="input" required placeholder="KM Building v ABC Contractors" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="reference">Reference</label>
            <input id="reference" name="reference" className="input" placeholder="HKIAC/2026/001" />
          </div>
          <div>
            <label className="label" htmlFor="tribunal">Tribunal</label>
            <input id="tribunal" name="tribunal" className="input" placeholder="HKIAC / Adjudication" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="claimant">Claimant</label>
            <input id="claimant" name="claimant" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="respondent">Respondent</label>
            <input id="respondent" name="respondent" className="input" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" className="textarea" rows={3} />
        </div>
        <div className="flex justify-end gap-2">
          <Link href="/cases" className="btn btn-secondary">Cancel</Link>
          <button type="submit" className="btn btn-primary">Create case</button>
        </div>
      </form>
    </div>
  );
}
