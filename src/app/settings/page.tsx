import TopBar from "@/components/TopBar";
import { guardUser } from "@/lib/guard";
import { hasOpenAI, CHAT_MODEL, EMBEDDING_MODEL, providerLabel } from "@/lib/ai/openai";
import { embeddingMode } from "@/lib/ai/embed";

export default async function SettingsPage() {
  const user = await guardUser();
  const openai = hasOpenAI();
  return (
    <div className="flex-1 flex flex-col">
      <TopBar />
      <main className="max-w-[820px] mx-auto w-full px-5 py-8">
        <h1 className="text-xl font-semibold mb-5">Settings</h1>

        <div className="card p-5 mb-6">
          <h2 className="font-semibold mb-3">Account</h2>
          <dl className="text-[13px] space-y-2">
            <div className="flex justify-between"><dt className="text-[color:var(--muted)]">Name</dt><dd>{user.name}</dd></div>
            <div className="flex justify-between"><dt className="text-[color:var(--muted)]">Email</dt><dd>{user.email}</dd></div>
            <div className="flex justify-between"><dt className="text-[color:var(--muted)]">Role</dt><dd>{user.role.replace(/_/g, " ")}</dd></div>
          </dl>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-3">AI configuration</h2>
          <dl className="text-[13px] space-y-2">
            <div className="flex justify-between">
              <dt className="text-[color:var(--muted)]">OpenAI</dt>
              <dd>
                {openai ? (
                  <span className="badge badge-resolved">configured</span>
                ) : (
                  <span className="badge badge-open">local fallback</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between"><dt className="text-[color:var(--muted)]">Provider</dt><dd>{providerLabel()}</dd></div>
            <div className="flex justify-between"><dt className="text-[color:var(--muted)]">Chat model</dt><dd>{CHAT_MODEL}</dd></div>
            <div className="flex justify-between"><dt className="text-[color:var(--muted)]">Embedding model</dt><dd>{EMBEDDING_MODEL}</dd></div>
            <div className="flex justify-between"><dt className="text-[color:var(--muted)]">Embedding mode</dt><dd>{embeddingMode()}</dd></div>
          </dl>
          {!openai && (
            <div className="banner-warning mt-4">
              No <code>OPENAI_API_KEY</code> set. The app runs fully offline using a deterministic
              local embedding + grounded answer fallback. Set the key in <code>.env.local</code> to
              enable OpenAI retrieval-augmented answers.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
