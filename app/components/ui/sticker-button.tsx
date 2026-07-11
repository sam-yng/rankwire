"use client";

import type { ReactNode } from "react";

type StickerButtonProps = {
  /** 'keep' fills with ink; 'skip' fills with gray. */
  variant: "keep" | "skip";
  /** Persistent pressed-flat state (kept / skipped). */
  active?: boolean;
  /** Rendered on an inverted (ink) surface. */
  inverted?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  children: ReactNode;
};

const BASE =
  "inline-flex items-center justify-center font-mono text-[12px] font-bold uppercase tracking-[0.08em] leading-none px-[15px] py-2 rounded-btn border cursor-pointer transition-all duration-[160ms] ease-spring active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

// The pressed-flat look shared by any active (kept/skipped) button.
const FLAT = "translate-x-[2px] translate-y-[2px] shadow-none";

function keepClasses(active: boolean, inverted: boolean): string {
  if (inverted) {
    return active
      ? `border-fg-invert bg-fg-invert text-surface-invert ${FLAT}`
      : "border-fg-invert bg-transparent text-fg-invert shadow-[2px_2px_0_var(--color-fg-invert)]";
  }
  return active
    ? `border-fg bg-accent text-on-accent ${FLAT}`
    : "border-fg bg-transparent text-fg shadow-sticker";
}

function skipClasses(active: boolean, inverted: boolean): string {
  if (inverted) {
    return active
      ? `border-meta-invert bg-meta-invert text-surface-invert ${FLAT}`
      : "border-meta-invert bg-transparent text-meta-invert shadow-[2px_2px_0_var(--color-meta-invert)]";
  }
  return active
    ? `border-skip bg-skip text-on-accent ${FLAT}`
    : "border-skip bg-transparent text-meta shadow-[2px_2px_0_var(--color-skip)]";
}

export function StickerButton({
  variant,
  active = false,
  inverted = false,
  onClick,
  type = "button",
  children,
}: StickerButtonProps) {
  const variantClasses =
    variant === "keep" ? keepClasses(active, inverted) : skipClasses(active, inverted);
  return (
    <button
      type={type}
      onClick={onClick}
      aria-pressed={active}
      className={`${BASE} ${variantClasses}`}
    >
      {children}
    </button>
  );
}
