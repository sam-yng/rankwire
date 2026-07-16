"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="max-w-[520px] border border-fg bg-surface p-6 text-center shadow-card sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-meta">
          Wire interrupted
        </p>
        <h1 className="mt-3 font-serif text-[30px] leading-tight text-fg">
          Feed could not load.
        </h1>
        <p className="mt-3 font-sans text-[15px] leading-[1.6] text-meta">
          Try again. If it keeps happening, return shortly while service reconnects.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-btn border border-fg bg-page px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-fg shadow-sticker transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
