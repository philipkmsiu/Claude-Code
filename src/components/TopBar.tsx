import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

export default async function TopBar() {
  const user = await getCurrentUser();
  return (
    <header className="bg-[color:var(--primary)] text-white">
      <div className="max-w-[1400px] mx-auto px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/cases" className="font-semibold text-[15px] tracking-tight">
            KM Claim OS
          </Link>
          <span className="text-white/60 text-[12px] hidden sm:inline">
            Construction Arbitration Case Management
          </span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-[12px] text-white/80">
              {user.name} · {user.role.replace(/_/g, " ")}
            </span>
          )}
          <Link href="/settings" className="text-[12px] text-white/80 hover:text-white">
            Settings
          </Link>
          <form action={logoutAction}>
            <button className="text-[12px] text-white/80 hover:text-white" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
