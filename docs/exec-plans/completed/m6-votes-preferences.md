# M6 — Votes + tag preferences

Status: completed (started and completed 2026-07-14).

Goal: close the feedback loop. A signed-in user's votes adjust only their tag
weights and ranked feed; all fifteen weights are also directly editable.

Spec: `../../design-docs/rankwire-design.md` §8, §9, §11 and
`../../design-docs/rankwire-design-system.md` §4, §7. M4 already provides the
one-user rescore path. M5 already provides viewer-scoped feed reads and reserved
card-footer space. M5 is complete; its remaining signed-in feed smoke test moved
here so one manual session can verify feed data, vote mutations, preferences,
and user isolation together.

## Decisions

- Keep the specified `POST /api/vote` JSON contract. It gives the client vote
  controls a narrow endpoint and keeps auth and Zod validation at the boundary.
- Treat a missing vote as `0` and apply `(newValue - previousValue) * 0.5` to
  every article tag. Therefore first `+1` applies `+0.5`, changing `+1` to `-1`
  applies `-1.0`, and repeating `-1` applies `0`. This makes the upsert
  idempotent and reverses the old signal instead of double-counting it.
- Commit the vote, tag-weight adjustments, and that user's full rescore in one
  database transaction. Missing article IDs return `404`; unauthenticated,
  malformed, and failed mutations cannot partially change weights or scores.
- Load each viewer's existing vote alongside feed rows. Optimistic controls
  roll back on API failure and refresh the Server Component after success so a
  score change can reorder the visible feed.
- Preferences use a server action backed by a tested domain service. The
  payload must contain every taxonomy tag exactly once, no unknown/duplicate
  tags, and finite numeric weights. Number steppers use `0.5` increments without
  inventing a product-level min/max absent from the design spec.

## Delivery slices

1. Vote domain + route (`lib/votes.ts`, `app/api/vote/route.ts`):
   - isolate differential-delta calculation and persistence behind a narrow
     store interface for deterministic tests;
   - concrete Prisma store uses a serializable interactive transaction with
     conflict retries, upserts the viewer's vote, increments only that viewer's
     tag rows, and rescoring only that viewer before commit;
   - authenticate before parsing/mutation and return stable JSON errors for
     invalid input and missing articles.
2. Feed vote state + controls (`lib/feed.ts`, `app/components/vote-buttons.tsx`,
   `app/components/article-card.tsx`):
   - fetch only the current viewer's vote and normalize it to `1 | -1 | null`;
   - render accessible up/down sticker controls with optimistic selection,
     disabled in-flight submission, rollback/error feedback, and
     `router.refresh()` after success;
   - preserve current card layout and external-link behavior.
3. Preferences domain + page (`lib/preferences.ts`,
   `app/preferences/page.tsx` and a small client form component):
   - read all fifteen weights in taxonomy order, filling any legacy missing row
     from the seed default;
   - validate and upsert all submitted weights for only the session user, then
     rescore only that user's articles in the same transaction;
   - show clear save/error state and make the header Preferences link live.
4. Verification and closure:
   - unit-test initial/repeated/flipped vote deltas, viewer isolation, rescore
     trigger, missing article behavior, preference tag-set validation, and
     preference rescore scope;
   - extend feed tests for viewer-scoped persisted vote state;
   - update the test-integrity baseline only after new tests pass;
   - run `bun run check`, production build, and a local signed-in smoke test
     covering reload persistence, feed reorder, opposite vote, preferences save,
     and a second user's isolation.

## Progress

- [x] Reconcile M6 with M4/M5 code and decide mutation semantics.
- [x] Refine and activate plan.
- [x] Implement vote domain and authenticated API route.
- [x] Add persisted feed vote state and optimistic controls.
- [x] Add preferences editor and live navigation.
- [x] Run automated gate and production build.
- [x] Verify the unauthenticated shell, page redirect, and API guard locally.
- [x] Run local signed-in smoke test with ingested data.
- [x] Run signed-in multi-user mutation smoke test with real DB/Auth settings.

## Acceptance

- `POST /api/vote` rejects unauthenticated or malformed requests without writes.
- Voting up an `mcp`-tagged article raises only the voter's `mcp` weight by
  `0.5`, persists the selected state, and refreshes feed order.
- Repeating the same vote changes no weights; flipping it applies the exact
  reversal delta and leaves one `Vote` row.
- Saving preferences persists exactly the signed-in user's fifteen weights and
  refreshes their feed ranking.
- Another user's votes, weights, and scores remain untouched by either flow.
- `bun run check` and production build pass; manual signed-in flow is recorded.

Out of scope: aggregate vote counts, removing a vote back to neutral,
comment/social features, ranking-algorithm changes, and digest UI.

## Verification log

- 2026-07-14: vote slice — `bun run check` passed; 27 tests passed with 79
  assertions. Existing harness lint emits informational findings but no gate
  errors.
- 2026-07-14: feed controls and preferences slices — `bun run check` passed;
  32 tests passed with 94 assertions. `bun run build` passed and generated the
  vote API and preferences route. Local browser smoke verified the sign-in
  page, the `/preferences` redirect to sign-in, no browser console errors, and
  an unauthenticated vote response of `401 {"error":"Unauthorized"}`.
- 2026-07-14: signed-in vote persistence, reorder, opposite-vote, preference
  save, and second-user isolation smoke remains pending because this runtime has
  none of `DATABASE_URL`, `DIRECT_DATABASE_URL`, `AUTH_SECRET`,
  `AUTH_GOOGLE_ID`, or `AUTH_GOOGLE_SECRET`. Keep the plan active until those
  external credentials are available and the manual check is recorded.
- 2026-07-14: M5 completed after its remaining local signed-in feed smoke check
  moved into this plan. M6 now owns both outstanding manual checks.
- 2026-07-14: signed-session smoke used isolated real-DB/Auth fixture users and
  articles, deleted after verification. Initial/repeated/flipped votes produced
  `+0.5`/`0`/`-1.0` per target tag, persisted across a feed reload, and reordered
  the target above a comparison article. Saving all fifteen preferences persisted
  the signed-in user's values and rescored the feed; second user's weights and
  scores remained unchanged. `bun run check` passed (32 tests, 94 assertions)
  and `bun run build` passed.
