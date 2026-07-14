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
        className={`${BASE} ${pathname === "/" ? "underline underline-offset-4" : ""}`}
        href="/"
        aria-current={pathname === "/" ? "page" : undefined}
      >
        Feed
      </Link>
      <span className="cursor-not-allowed text-meta" title="Coming in M7">
        Digest
      </span>
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
