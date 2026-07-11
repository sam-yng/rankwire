type RuleProps = {
  /** 'ink' = 1px solid ink; 'hairline' = 1px divider tone. */
  tone?: "ink" | "hairline";
};

export function Rule({ tone = "ink" }: RuleProps) {
  return (
    <hr className={`h-px w-full border-0 ${tone === "ink" ? "bg-fg" : "bg-rule"}`} />
  );
}

/** Nameplate underline: 3px ink bar + 2px gap + 1px ink line. */
export function DoubleRule() {
  return (
    <div aria-hidden className="w-full">
      <div className="h-[3px] w-full bg-fg" />
      <div className="h-[2px]" />
      <div className="h-px w-full bg-fg" />
    </div>
  );
}
