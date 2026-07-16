# M7 — In-app digest + GitHub Actions scheduling

Status: active (started 2026-07-15).

Goal: ship a personalised two-day digest view and wire unattended hourly
ingestion for activation with M8's production deployment.

Spec: `../../design-docs/rankwire-design.md` §1, §4, §8, §10, §11 and
`../../design-docs/rankwire-design-system.md` §4, §7. M4 provides precomputed
per-user scores, M5 provides article cards, and M6 provides persisted viewer
vote state.

## Decisions

- Define windows as fixed 48-hour UTC buckets anchored at the Unix epoch.
  Calendar and labels therefore remain deterministic across requests, hosts,
  time zones, and daylight-saving changes.
- Show ten articles per window, satisfying the specified 8–12 range. Rank by
  score descending, then publication time descending, then article ID ascending
  for deterministic ties. Show windows newest first.
- Keep grouping in a tested domain helper and the viewer-scoped Prisma read
  behind a narrow store interface. Read scored articles once, then group at read
  time; add no digest table, cron, or bookkeeping.
- Reuse `ArticleCard` and its persisted vote controls. A digest vote may refresh
  ordering because the mutation rescoring path already updates viewer scores.
- Schedule ingestion at minute 17 of every hour to avoid the busiest top-of-hour
  window. Use repository variable `APP_URL` for M8's deployed origin and Actions
  secret `CRON_SECRET` for the shared header. Skip scheduled jobs until
  `APP_URL` exists; fail a premature manual dispatch with a clear message.
- Wire scheduling now but do not claim live-run acceptance before M8 supplies
  `APP_URL`, configures the same `CRON_SECRET` in Vercel, and deploys the route.

## Delivery slices

1. Digest domain (`lib/digest.ts`, `lib/digest.test.ts`):
   - define 48-hour UTC bucket boundaries and human-readable date ranges;
   - group unsorted scored articles into newest-first windows;
   - retain the top ten with deterministic ranking and viewer vote state;
   - test boundaries, ordering, truncation, ties, empty input, and viewer scope.
2. Digest page and navigation (`app/digest/page.tsx`,
   `app/components/header-nav.tsx`):
   - require an authenticated session before the viewer-scoped query;
   - render each window with a date-range heading and reusable article grid;
   - show a useful empty state and make Digest primary navigation live.
3. Scheduled ingestion (`.github/workflows/ingest.yml`):
   - hourly schedule plus manual dispatch;
   - one network step POSTs `${APP_URL}/api/ingest` with `x-cron-secret`;
   - configure the repository `CRON_SECRET` when a durable matching value is
     available, without exposing it in source or logs.
4. Verification and closure:
   - run focused unit tests, update the test-integrity baseline after additions,
     then run `bun run check` and `bun run build`;
   - smoke the unauthenticated redirect and digest rendering where local
     credentials permit;
   - after M8, set `APP_URL`, manually dispatch ingestion, confirm HTTP 200 and
     new articles, then observe scheduled runs for one day.

## Progress

- [x] Reconcile M7 with M4–M6 code and refine boundary/query/workflow semantics.
- [x] Activate plan.
- [x] Implement and test digest domain.
- [x] Add session-gated digest page and live navigation.
- [x] Add hourly/manual ingestion workflow.
- [x] Configure GitHub Actions secret contract.
- [x] Run automated gate, production build, and feasible local smoke checks.
- [ ] Verify deployed manual and scheduled ingestion after M8.

## Acceptance

- `/digest` redirects unauthenticated viewers and shows signed-in viewers'
  scored articles in deterministic two-day UTC groups, newest window first.
- Each window contains at most ten articles ordered by score, recency, and ID;
  articles exactly on a 48-hour boundary land in the newer window.
- Digest reads and vote state are scoped to the current viewer; an empty viewer
  digest renders a clear state instead of failing.
- Workflow supports hourly and manual execution, sends the secret header, and
  contains no committed production URL or secret.
- `bun run check` and `bun run build` pass.
- After M8: manual dispatch returns HTTP 200 and ingests articles; hourly runs
  remain green for one day.

Out of scope: email, per-user digest cadence, digest persistence, ranking
algorithm changes, deployment, and portfolio polish.

## Verification log

- 2026-07-15: refinement found no configured Actions secrets or variables and
  no local app/Auth/DB credentials. Live workflow and signed-in browser checks
  remain intentionally dependent on M8 or supplied environment configuration.
- 2026-07-15: added six digest tests covering fixed UTC boundaries,
  newest-first windows, date labels, top-ten truncation, deterministic ties,
  empty input, viewer scoping, and vote preservation. Full gate passed with 38
  tests and 107 assertions; test-integrity baseline advanced only after all new
  tests passed. Production build passed and emitted `/digest` as a dynamic
  server-rendered route.
- 2026-07-15: generated a 256-bit `CRON_SECRET`, stored it in ignored
  `.env.local`, and configured the matching GitHub Actions secret. `APP_URL`
  remains unset by design; scheduled jobs skip until M8 sets the repository
  variable, while manual dispatch reports missing configuration.
- 2026-07-15: production-server smoke returned `307` from `/digest` to
  `/signin` and `200` for `/signin`. Signed-in digest rendering could not run
  because this environment has no Auth/DB credentials. Live manual dispatch
  and one-day scheduled observation remain pending M8 deployment.
- 2026-07-16: final local project checks passed unchanged: `bun run check`
  (38 tests, 107 assertions, test-integrity and plan-lifecycle guards) and
  `bun run build` (including dynamic `/digest`). M8 deployment verification
  remains the only open acceptance work.
