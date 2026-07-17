import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/cases");
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-2xl font-semibold text-[color:var(--primary)]">
            KM Claim OS
          </div>
          <p className="text-[color:var(--muted)] mt-1 text-[13px]">
            Construction arbitration case management
          </p>
        </div>
        <div className="card p-6">
          <LoginForm />
        </div>
        <p className="text-center text-[12px] text-[color:var(--muted)] mt-4">
          Demo login: <strong>admin@kmclaim.test</strong> / <strong>demo1234</strong>
        </p>
      </div>
    </div>
  );
}
