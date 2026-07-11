"use client";

import { useState } from "react";
import {
  Badge,
  DoubleRule,
  EndMark,
  Masthead,
  Rule,
  SegmentedControl,
  StickerButton,
  UnreadTicker,
} from "../components/ui";

const SWATCHES = [
  { name: "page", cls: "bg-page" },
  { name: "surface", cls: "bg-surface" },
  { name: "surface-invert", cls: "bg-surface-invert" },
  { name: "fg", cls: "bg-fg" },
  { name: "meta", cls: "bg-meta" },
  { name: "rule", cls: "bg-rule" },
  { name: "accent", cls: "bg-accent" },
  { name: "skip", cls: "bg-skip" },
  { name: "end", cls: "bg-end" },
];

type Layout = "dense" | "card" | "numbered";
type Filter = "all" | "unread";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg">
          {`// ${label}`}
        </span>
        <div className="flex-1">
          <Rule />
        </div>
      </div>
      {children}
    </section>
  );
}

export function Showcase() {
  const [layout, setLayout] = useState<Layout>("card");
  const [filter, setFilter] = useState<Filter>("all");
  const [kept, setKept] = useState(false);
  const [skipped, setSkipped] = useState(false);

  function keep() {
    setKept((k) => !k);
    setSkipped(false);
  }
  function skip() {
    setSkipped((s) => !s);
    setKept(false);
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 py-12">
      <Masthead
        date="THU 02 JUL 2026"
        tagline="Design system · proof sheet"
        edition="No. 1,205 · Vol. IV"
        title="The Wire"
        controls={
          <>
            <UnreadTicker count={filter === "unread" ? 2 : 3} />
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-meta">
                  {"// layout"}
                </span>
                <SegmentedControl<Layout>
                  ariaLabel="Layout"
                  value={layout}
                  onChange={setLayout}
                  options={[
                    { value: "dense", label: "List" },
                    { value: "card", label: "Front page" },
                    { value: "numbered", label: "Filed" },
                  ]}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-meta">
                  {"// show"}
                </span>
                <SegmentedControl<Filter>
                  ariaLabel="Show"
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: "all", label: "All" },
                    { value: "unread", label: "Unread" },
                  ]}
                />
              </div>
            </div>
          </>
        }
      />

      <Section label="colour tokens">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
          {SWATCHES.map((s) => (
            <div key={s.name}>
              <div className={`h-16 w-full rounded-btn border border-rule ${s.cls}`} />
              <div className="mt-1 font-mono text-[10px] text-meta">{s.name}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section label="typography">
        <div className="space-y-3">
          <div className="font-display text-[40px] leading-[1.02] tracking-[-0.01em] text-fg">
            Libre Caslon Display — the nameplate voice
          </div>
          <h2 className="font-serif text-[24px] font-bold leading-[1.16] text-fg">
            Libre Caslon Text, weight 700 — the headline voice
          </h2>
          <p className="max-w-[62ch] font-sans text-[14.5px] leading-[1.5] text-meta">
            Geist sans carries running prose: article summaries and empty-state copy. It
            never sets a headline or a label.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.11em] text-meta">
            JetBrains Mono · labels · meta · 09:14 · Simon Willison · 4m
          </p>
        </div>
      </Section>

      <Section label="sticker buttons">
        <div className="flex flex-wrap items-center gap-4">
          <StickerButton variant="keep" active={kept} onClick={keep}>
            {kept ? "Kept ✓" : "Keep"}
          </StickerButton>
          <StickerButton variant="skip" active={skipped} onClick={skip}>
            {skipped ? "Skipped" : "Skip"}
          </StickerButton>
          <span className="font-mono text-[11px] text-meta">
            ← click to toggle · press for the spring
          </span>
        </div>
        <div className="mt-4 inline-flex flex-wrap items-center gap-4 rounded-card bg-surface-invert p-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-meta-invert">
            inverted
          </span>
          <StickerButton variant="keep" inverted>
            Keep
          </StickerButton>
          <StickerButton variant="skip" inverted>
            Skip
          </StickerButton>
        </div>
      </Section>

      <Section label="badges & rules">
        <div className="flex flex-wrap items-center gap-4">
          <Badge>New</Badge>
          <Badge variant="outline">New</Badge>
          <span className="font-mono text-[11px] text-meta">solid · outline</span>
        </div>
        <div className="mt-6 max-w-[420px] space-y-4">
          <div>
            <div className="mb-1 font-mono text-[10px] text-meta">Rule (ink)</div>
            <Rule />
          </div>
          <div>
            <div className="mb-1 font-mono text-[10px] text-meta">Rule (hairline)</div>
            <Rule tone="hairline" />
          </div>
          <div>
            <div className="mb-1 font-mono text-[10px] text-meta">DoubleRule</div>
            <DoubleRule />
          </div>
        </div>
      </Section>

      <Section label="unread ticker">
        <div className="space-y-4">
          <UnreadTicker count={3} />
          <UnreadTicker count={0} />
        </div>
      </Section>

      <Section label="empty state">
        <EndMark title="Nothing new on the wire">
          You&rsquo;ve cleared every unread dispatch since your last visit. Switch back
          to <strong className="text-fg">All</strong> to reread, or check back after the
          next pull.
        </EndMark>
      </Section>
    </div>
  );
}
