import type { ReactNode } from "react";

type BadgeProps = {
  /** 'solid' = paper-on-ink fill; 'outline' = ink text + ink hairline. */
  variant?: "solid" | "outline";
  children: ReactNode;
};

export function Badge({ variant = "solid", children }: BadgeProps) {
  const variantClasses =
    variant === "solid"
      ? "bg-accent text-on-accent px-[6px] py-[3px]"
      : "border border-fg text-fg px-[5px] py-[2px]";
  return (
    <span
      className={`inline-block rounded-btn font-mono text-[9px] font-bold uppercase leading-none tracking-[0.1em] ${variantClasses}`}
    >
      {children}
    </span>
  );
}
