"use client";

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      {ariaLabel ? <legend className="sr-only">{ariaLabel}</legend> : null}
      <div className="inline-flex overflow-hidden rounded-seg border border-fg">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={`cursor-pointer whitespace-nowrap border-0 border-r border-fg px-3 py-[7px] font-mono text-[11px] font-medium tracking-[0.03em] transition-colors last:border-r-0 active:translate-y-px ${
                active ? "bg-accent text-on-accent" : "bg-transparent text-fg"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
