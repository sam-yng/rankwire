import { requireSession } from "@/lib/session";

export default async function Home() {
  const session = await requireSession();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 py-32">
      <h1 className="text-3xl font-semibold tracking-tight">Young Post</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Signed in as {session.user?.email}. Feed coming soon.
      </p>
    </main>
  );
}
