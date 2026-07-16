"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE = "font-bold text-fg hover:underline hover:underline-offset-4";

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="hidden items-center gap-4 font-mono text-[10px] uppercase tracking-[0.12em] sm:flex"
    >
      <Link
        className={`${BASE} ${pathname === "/feed" ? "underline underline-offset-4" : ""}`}
        href="/feed"
        aria-current={pathname === "/feed" ? "page" : undefined}
      >
        Feed
      </Link>
      <Link
        className={`${BASE} ${pathname === "/digest" ? "underline underline-offset-4" : ""}`}
        href="/digest"
        aria-current={pathname === "/digest" ? "page" : undefined}
      >
        Digest
      </Link>
      <Link
        className={`${BASE} ${pathname === "/preferences" ? "underline underline-offset-4" : ""}`}
        href="/preferences"
        aria-current={pathname === "/preferences" ? "page" : undefined}
      >
        Preferences
      </Link>
    </nav>
  );
}
