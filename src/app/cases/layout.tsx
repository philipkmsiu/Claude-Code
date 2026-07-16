import TopBar from "@/components/TopBar";
import { guardUser } from "@/lib/guard";

export default async function CasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardUser();
  return (
    <div className="flex-1 flex flex-col">
      <TopBar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
