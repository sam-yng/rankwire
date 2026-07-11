import type { ReactNode } from "react";
import { DoubleRule, Rule } from "./rule";

type MastheadProps = {
  /** Left dateline cell, e.g. "THU 02 JUL 2026". */
  date: string;
  /** Centre dateline cell, e.g. "Private dispatch · not for circulation". */
  tagline: string;
  /** Right dateline cell, e.g. "No. 1,205 · Vol. IV". */
  edition: string;
  /** Nameplate text. */
  title: string;
  /** Optional control row rendered in the ink-bordered strip below. */
  controls?: ReactNode;
};

export function Masthead({ date, tagline, edition, title, controls }: MastheadProps) {
  return (
    <div className="mx-auto w-full max-w-[1080px] px-6">
      <div className="flex items-baseline justify-between gap-4 pb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-meta">
        <span>{date}</span>
        <span className="hidden tracking-[0.24em] sm:inline">{tagline}</span>
        <span>{edition}</span>
      </div>
      <Rule />
      <h1 className="text-balance py-[14px] pb-3 text-center font-display text-[clamp(48px,12vw,96px)] leading-[0.92] tracking-[-0.01em] text-fg">
        {title}
      </h1>
      <DoubleRule />
      {controls ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fg py-4">
          {controls}
        </div>
      ) : null}
    </div>
  );
}
