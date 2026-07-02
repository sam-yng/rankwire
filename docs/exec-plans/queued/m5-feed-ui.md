# M5 — Personalised feed UI

Goal: signed-in users see their ranked article feed at `/`.

Spec: `../../design-docs/young-post-design.md` §4, §5. Read the bundled
fetching-data and caching guides first — this Next version's caching model
(Cache Components) differs from training data.

Steps:

1. `app/page.tsx` becomes a server component: session-gated, reads the
   viewer's `ArticleScore`-ordered articles (paginated, e.g. 30/page).
2. `app/components/`: `FeedList`, `ArticleCard` (title → external link,
   summary snippet, source, tags, published date, score placement for vote
   buttons in M6).
3. Layout header: app name, nav (Feed / Digest / Preferences), user avatar +
   sign-out.
4. Empty states: no articles yet (ingest hasn't run), unauthenticated →
   `/signin`.

Acceptance:

- Signed in locally with ingested data, `/` shows articles ordered by the
  viewer's scores; links open the source; pagination works.
- `bun run check` green.

Out of scope: votes (M6), digest page (M7), visual polish beyond clean
Tailwind defaults.
