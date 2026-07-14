# M5 — Personalised feed UI

Status: completed (started and completed 2026-07-14).

Goal: signed-in users see a clean, paginated version of their ranked article
feed at `/`, assembled from the M5.5 design-system primitives.

Spec: `../../design-docs/rankwire-design.md` §4, §5, §11 and
`../../design-docs/rankwire-design-system.md` §1–§4, §7. The bundled Next.js
`fetching-data` and `caching` guides were reviewed before implementation. Cache
Components are not enabled in `next.config.ts`, so this milestone keeps the
personalised Prisma read uncached and request-scoped.

## Delivery slices

1. Ranked-feed query (`lib/feed.ts`):
   - accept a viewer ID and one-based page number;
   - read only that viewer's `ArticleScore` rows and joined article fields;
   - order by score descending, then publication time descending, then article
     ID ascending for stable pagination;
   - fetch 31 rows for a 30-item page, returning 30 plus `hasNextPage`;
   - normalize missing, non-integer, zero, and negative `?page=` values to page
     1 without exposing them to Prisma;
   - keep storage behind a narrow interface so scoping and pagination are unit
     tested without a live database.
2. Feed components (`app/components/feed-list.tsx`,
   `app/components/article-card.tsx`):
   - external title link with safe new-tab attributes;
   - source, tags, published date, score, and optional summary snippet;
   - editorial typography and design tokens from M5.5;
   - stable footer space where M6 can add vote controls without restructuring
     article content.
3. Feed page (`app/page.tsx`):
   - call `requireSession()` before the personalised query;
   - render masthead, feed list, previous/next links preserving one-based pages,
     and an `EndMark` empty state when no ranked articles exist;
   - use Server Components only; M5 needs no client state.
4. Header (`app/components/header.tsx`):
   - restyle with design-system tokens;
   - signed-in identity/avatar and sign-out action;
   - Feed is live; Digest and Preferences are visible as disabled future routes
     until M7 and M6 implement them, avoiding dead navigation.
5. Verification:
   - unit tests cover page parsing, viewer scoping, 31-row lookahead, trimming,
     and empty pages without weakening existing tests;
   - `bun run check` passes;
   - local signed-in smoke test with ingested data is owned by active M6, where
     the same feed also exercises persisted votes and preference-driven ranking.

## Progress

- [x] Refine plan, resolve query/pagination/header contracts, activate milestone.
- [x] Implement ranked-feed query and unit tests.
- [x] Build article cards, feed list, masthead page, and pagination.
- [x] Restyle authenticated header.
- [x] Run automated gate and production build.

Lifecycle note: signed-in feed smoke ownership transferred to M6 before this
plan moved to `completed/`.

## Acceptance

- Unauthenticated `/` redirects to `/signin` before any feed query.
- Signed-in `/` shows only the viewer's articles, ordered by score with stable
  tie-breaks; external links open safely in a new tab.
- Pagination shows 30 articles per page, never duplicates the lookahead row, and
  produces working previous/next links.
- Empty ranked data produces an intentional `EndMark`, not a blank page.
- Header remains usable on public and authenticated routes, with no links to
  unimplemented pages.
- `bun run check` green.

Out of scope: votes (M6), live Preferences route (M6), live Digest route (M7),
feed density modes, unread tracking, and visual polish beyond the established
M5.5 system.
