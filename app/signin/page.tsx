import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 py-32">
      <h1 className="text-3xl font-semibold tracking-tight">Young Post</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Sign in to get your personalised engineering-news feed.
      </p>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Continue with Google
        </button>
      </form>
    </main>
  );
}
