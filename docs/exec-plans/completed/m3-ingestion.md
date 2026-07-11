# M3 — Sources + ingestion route

Goal: cron-callable `/api/ingest` that pulls all sources, dedupes by URL, and
stores normalized articles.

Spec: `../../design-docs/young-post-design.md` §7. Read the bundled
route-handlers guide before writing the route.

Steps:

1. `bun add rss-parser`.
2. `lib/sources.ts`: `Source` type and the 12 decided sources with tags.
   Include the add-when-available note for the official Anthropic feed.
3. `lib/ingest.ts`: `runIngestion()` per the spec — `Promise.allSettled`, per
   item Zod-validate/normalize `{ url, title, summary, source, tags,
   publishedAt }`, `db.article.upsert` on `url` with `update: {}`.
4. `app/api/ingest/route.ts`: POST, rejects unless the `CRON_SECRET` header
   matches; runs ingestion and returns per-source counts/failures as JSON.
5. First real tests (`bun test`): normalization and dedupe logic with fixture
   feed XML; a failing source must not fail the run.
6. Now that a real test command exists, re-run the harness pieces that depend
   on it: set `"test": "bun test"`, add the `test` + `guard:tests` gate stages
   and guardrails files (rerun `h-alter install` or add per its templates),
   and record the baseline:
   `node .agents/guardrails/check-test-integrity.mjs --update-baseline`.

Acceptance:

- `curl -X POST -H "x-cron-secret: …" localhost:3000/api/ingest` populates
  Neon with real articles from live feeds; second run creates no duplicates.
- Wrong/missing secret → 401.
- `bun run check` green including the new test and guard stages.

Out of scope: scoring (M4), scheduling (M7), conditional GET politeness
(nice-to-have, later).
