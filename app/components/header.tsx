import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { HeaderNav } from "./header-nav";
import { StickerButton } from "./ui";

export async function Header() {
  const session = await auth();
  const homeHref = session?.user ? "/feed" : "/";

  return (
    <header className="border-b border-rule bg-page">
      <div className="mx-auto flex min-h-16 w-full max-w-[1080px] items-center justify-between gap-6 px-6 py-3">
        <Link
          href={homeHref}
          className="font-display text-[25px] leading-none text-fg focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg"
        >
          Rankwire
        </Link>

        {session?.user ? (
          <div className="flex min-w-0 items-center gap-5">
            <HeaderNav />

            <div className="hidden min-w-0 items-center gap-2.5 lg:flex">
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-full border border-fg bg-surface font-mono text-[11px] font-bold uppercase text-fg"
              >
                {avatarInitial(session.user.name, session.user.email)}
              </span>
              <span className="max-w-40 truncate font-mono text-[10px] uppercase tracking-[0.08em] text-meta">
                {session.user.name ?? session.user.email}
              </span>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <StickerButton type="submit" variant="skip">
                Sign out
              </StickerButton>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function avatarInitial(name?: string | null, email?: string | null): string {
  return (name?.trim() || email?.trim() || "?").charAt(0);
}
