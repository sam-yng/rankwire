import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/feed");

  return (
    <main className="page-enter flex min-h-[calc(100dvh-65px)] flex-1 items-center overflow-hidden px-6 py-8">
      <section className="mx-auto w-full max-w-[650px] border-y border-fg py-8 text-center sm:py-11">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-meta">
          Personal engineering dispatch
        </p>
        <h1 className="mt-5 text-balance font-display text-[clamp(58px,15vw,112px)] leading-[0.84] tracking-[-0.035em] text-fg">
          Rankwire
        </h1>
        <div className="mx-auto mt-7 max-w-[470px] space-y-3 font-sans text-[15px] leading-[1.65] text-meta sm:text-[16px]">
          <p>Engineering reading, gathered from people and teams worth following.</p>
          <p>Keep or skip stories. Rankwire learns what belongs at top of your wire.</p>
        </div>
        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/feed" });
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-3 rounded-btn border border-fg bg-surface px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-fg shadow-sticker transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-card active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <GoogleMark />
            Continue with Google
          </button>
        </form>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.71-.06-1.2-.19-1.72H12v3.35h5.38a4.6 4.6 0 0 1-2 3.02l2.92 2.27c1.75-1.62 3.05-4.01 3.05-6.92Z"
      />
      <path
        fill="#34A853"
        d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-2.92-2.27c-.81.54-1.85.92-3.53.92-2.55 0-4.72-1.73-5.49-4.05l-3.02 2.33A9.75 9.75 0 0 0 12 21.75Z"
      />
      <path
        fill="#FBBC05"
        d="M6.51 13.99A5.87 5.87 0 0 1 6.2 12c0-.7.12-1.38.3-2L3.5 7.67A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.24 4.33l3.02-2.34Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.96c1.79 0 3.39.61 4.65 1.8l3.49-3.49C16.83 1.2 14.63.25 12 .25a9.75 9.75 0 0 0-8.51 5.42L6.5 8c.78-2.32 2.95-4.04 5.5-4.04Z"
      />
    </svg>
  );
}
