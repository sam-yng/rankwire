import type { ReactNode } from "react";

type EndMarkProps = {
  /** The "end of story" glyph. */
  mark?: string;
  /** Mono status line, e.g. "Nothing new on the wire". */
  title: string;
  /** Supporting prose. */
  children?: ReactNode;
};

export function EndMark({ mark = "— 30 —", title, children }: EndMarkProps) {
  return (
    <div className="px-6 pt-24 pb-20 text-center">
      <div className="font-display text-[44px] leading-none text-end">{mark}</div>
      <div className="mt-[18px] font-mono text-[12px] uppercase tracking-[0.16em] text-fg">
        {title}
      </div>
      {children ? (
        <p className="mx-auto mt-4 max-w-[340px] font-sans text-[15px] leading-[1.6] text-meta">
          {children}
        </p>
      ) : null}
    </div>
  );
}
