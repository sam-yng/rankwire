type UnreadTickerProps = {
  /** Number of unread items; drives filled bars + status text. */
  count: number;
  /** Total bars rendered (filled + empty). */
  total?: number;
};

export function UnreadTicker({ count, total = 5 }: UnreadTickerProps) {
  const bars = Array.from({ length: total }, (_, i) => ({
    id: `bar-${i}`,
    filled: i < count,
    delay: i * 0.12,
  }));
  return (
    <div className="flex items-center gap-[10px]">
      <div className="flex items-end gap-[3px]">
        {bars.map((bar) => (
          <span
            key={bar.id}
            className={`block h-5 w-[14px] rounded-[1px] border border-fg ${
              bar.filled ? "bg-fg" : "bg-transparent"
            }`}
            style={
              bar.filled
                ? {
                    animation: "tickPulse 1.6s ease-in-out infinite",
                    animationDelay: `${bar.delay}s`,
                    transformOrigin: "bottom",
                  }
                : undefined
            }
          />
        ))}
      </div>
      {count > 0 ? (
        <span className="inline-block rounded-btn bg-accent px-2 py-[3px] font-mono text-[12px] text-on-accent">
          {count} new since your last visit
        </span>
      ) : (
        <span className="font-mono text-[12px] text-meta">
          you&rsquo;re all caught up
        </span>
      )}
    </div>
  );
}
