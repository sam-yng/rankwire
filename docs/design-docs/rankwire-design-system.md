# Rankwire — design system (the "Sam Young" monospace-editorial system)

Source: the **The Wire** design handoff (hifi), reinterpreted as a reusable
design-system layer for Rankwire. The handoff bundle lives untracked under the
author's Downloads; its README + `reference-logic.js` are the pixel-level spec.
This doc is the durable record of what that handoff means for *this* codebase.

Scope of the milestone that implements this: **m5.5-design-system** — the
foundation layer only (tokens, fonts, primitives, a `/style` proof page). It does
**not** build the article feed; m5 (queued) consumes this layer to build
`FeedList` / `ArticleCard`.

## 1. Identity (do not dilute)

Monospace-editorial. Three things carry the identity and must survive any later
change:

1. **Ink-on-paper palette** — warm off-white paper, near-black ink. Not pure
   white / pure black.
2. **Hard offset "sticker" shadows** — `Npx Npx 0` solid, no blur. Buttons
   (`2px`), cards (`4px`, kept `6px`). On `:active` a button drops its shadow and
   translates into its own footprint (the sticker gets pushed flat).
3. **Newspaper voice** — Libre Caslon display/text serif for headlines and the
   nameplate; JetBrains Mono for every label, meta, time, byline, button, and
   ticker; Geist sans only for running body prose (summaries).

## 2. Theming

The handoff is a single fixed light (paper/ink) design; dark tones appear only as
intrinsic accents (inverted front-page card, email frame). Per product decision
(2026-07-11) we add a **designed dark variant** so the whole app can invert.

Two token layers:

- **Brand constants** — raw hexes from the handoff. Fixed; never flip. Used where
  a colour is intrinsic to the mark (e.g. the email frame is always dark).
- **Semantic roles** — `page / surface / surface-invert / fg / fg-invert / meta /
  rule / accent / on-accent / shadow`. These flip between light and dark.

Theme resolution:

- Default follows `prefers-color-scheme`.
- An explicit `data-theme="light" | "dark"` on any ancestor overrides it (lets the
  `/style` page show both side-by-side, and lets a future toggle force a theme).

Dark mapping (mirror, not a new palette): `page↔ink`, `fg↔paper-tone`,
`surface→#1B1B19`, `meta→#B4B2AA`, `rule→rgba(paper,.18)`, `accent→paper-tone`,
`on-accent→ink`, and the **shadow colour flips to a light tone** so the hard
offset still reads on a dark ground.

## 3. Tokens

Implemented as CSS custom properties in `app/globals.css`, exposed to Tailwind v4
via `@theme inline` (so `bg-page`, `text-fg`, `text-meta`, `border-rule`,
`shadow-sticker`, `font-mono`, `font-display`, etc. all work).

### Colour — brand constants
| Token | Hex | Role |
|---|---|---|
| `--ink` | `#141414` | primary text/borders (light) |
| `--paper` | `#FBFBF9` | page background (light) |
| `--card` | `#FFFFFF` | surface (light) |
| `--onink` | `#F4F3EE` | text on dark |
| `--meta` | `#727069` | secondary text (light) |
| `--meta-inv` | `#B4B2AA` | secondary text on dark |
| `--rule` | `#E4E3DE` | hairline divider (light) |
| `--body-onink` | `#D9D7CF` | body prose on dark |
| `--skip-border` | `#CFCDC5` | skipped-card border |
| `--skip-gray` | `#9A988F` | skip button gray (light) |
| `--end-gray` | `#C4C2BA` | empty-state "— 30 —" mark |
| `--email-frame` | `#1B1B19` | email dark frame (always dark) |

### Colour — semantic roles (`--color-*`, flip per theme)
`page`, `surface`, `surface-invert`, `fg`, `fg-invert`, `meta`, `meta-invert`,
`rule`, `accent`, `on-accent`, `shadow`, `skip`. Light values map to the brand
constants above; dark values are the mirror from §2.

### Typography
| Family var | Family | Use |
|---|---|---|
| `--font-display` | Libre Caslon Display, Georgia, serif | nameplate, lead headline, filed numbers, "— 30 —" |
| `--font-serif` | Libre Caslon Text, Georgia, serif | article headlines |
| `--font-mono` | JetBrains Mono | labels, meta, time, byline, buttons, ticker |
| `--font-sans` | Geist | summaries, empty-state prose |

Key sizes (handoff): nameplate `96px`, lead headline `40px`, span-3 card `26px`,
list headline `24px`, filed headline `25px`, filed number `46px`, summaries
`14.5px`, mono labels `9–12px`. Sizes live inline on components, not as tokens.

### Radius / shadow / motion
- Radius: cards `4px` (`--radius-card`), segmented container `3px`, buttons/badges
  `2px` (`--radius-btn`), email frame `8px`, ticker bars `1px`.
- Shadow: `--shadow-sticker` = `2px 2px 0 var(--color-shadow)` (buttons);
  `--shadow-card` = `4px 4px 0 var(--color-shadow)`; `--shadow-card-kept` =
  `6px 6px 0 var(--color-shadow)`. Soft email shadow is component-local.
- Motion: button spring `all .16s cubic-bezier(.2,.85,.3,1.2)`; generic state
  `.2s–.25s ease`. `tickPulse` keyframe `scaleY(1)→.68→1`, `1.6s` infinite,
  staggered `.12s`/bar, `transform-origin:bottom`. **All motion respects
  `prefers-reduced-motion`.**

Spacing: 4px base grid; content column `max-width:1080px`, `padding:0 24px`.

## 4. Primitives (`app/components/ui/`)

Framework-native React components — the reusable vocabulary m5 will assemble.
Each is domain-agnostic (no article/DB knowledge) and driven by props.

| Component | Contract |
|---|---|
| `StickerButton` | `variant: 'keep' \| 'skip'`, `active`, `inverted`, `onClick`, `children`. Rest = transparent + hard `2px` shadow; active = filled + flat (`translate(2px,2px)`, no shadow); `:active` press physics via the spring. Keep→ink fill; Skip→gray fill. |
| `SegmentedControl` | `options: {value,label}[]`, `value`, `onChange`. 1px ink border, `radius 3px`, hairline between segments, active = ink bg / paper text, press `translateY(1px)`. |
| `Badge` | `children`, `variant: 'solid' \| 'outline'`. "NEW" mark — mono 9px 700, paper-on-ink (solid) or ink outline. |
| `Rule` / `DoubleRule` | horizontal ink rules; `DoubleRule` = `3px` bar + `2px` gap + `1px` line (nameplate underline). |
| `UnreadTicker` | `count`, `total=5`. Row of bars (filled = ink, pulse `tickPulse`) + mono status text/pill. Reduced-motion safe. |
| `Masthead` | `date`, `tagline`, `edition`, `title`, optional `children` (control row). Dateline row + rule + nameplate + double rule. |
| `EndMark` | empty-state "— 30 —" + mono line + prose. `title`, `note`, `children`. |

Interactive primitives are client components (`"use client"`); static ones
(`Rule`, `Masthead`, `Badge`, `EndMark`) stay server components.

## 5. `/style` — the proof page

`app/style/page.tsx`: renders the token swatches and every primitive in both
themes (two `data-theme`-scoped panels). It is the acceptance surface for m5.5 —
if it renders correctly in light and dark, the system is wired. It uses mock
inline data only (no DB, no session). Kept out of the authed feed.

## 6. Fonts

Loaded via `next/font/google` in `app/layout.tsx` as CSS variables:
`Geist` → `--font-geist-sans`, `JetBrains_Mono` → `--font-jetbrains-mono`,
`Libre_Caslon_Display` (weight 400) → `--font-caslon-display`,
`Libre_Caslon_Text` (weights 400/700, normal+italic) → `--font-caslon-text`.
`globals.css` aliases these into the semantic family tokens in §3. **Mono changes
from Geist Mono → JetBrains Mono** per the handoff.

## 7. Handoff → Rankwire mapping

The handoff app ("The Wire", single-reader Keep/Skip) is a *design reference*, not
our product. Rankwire is multi-user, thumbs up/down, ranked feed. The mapping:

- Keep/Skip sticker buttons → the vote UI vocabulary (up/down) in m6.
- Layout switch (List / Front page / Filed) → optional feed density modes in m5.
- Unread ticker → "new since last visit" affordance (later; needs last-visit ts).
- Email digest section → **out of scope** (email removed from product, per the
  build spec §1). Not ported. The in-app `/digest` view (m7) may reuse the
  mini-masthead treatment.

m5.5 ships the vocabulary; wiring to real data/votes is m5/m6/m7.
