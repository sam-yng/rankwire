# M7 — In-app digest + GitHub Actions scheduling

Goal: the 2-day digest view, and ingestion running unattended on a schedule.

Spec: `../../design-docs/young-post-design.md` §1, §8.

Steps:

1. `app/digest/page.tsx`: session-gated; group articles into 2-day windows by
   `publishedAt` (derived at read time — no cron or bookkeeping needed), show
   the viewer's top 8–12 per window by score, most recent window first.
2. `.github/workflows/ingest.yml`: hourly `schedule` (plus
   `workflow_dispatch`), one step: `curl -fsS -X POST -H "x-cron-secret:
   ${{ secrets.CRON_SECRET }}" <deployed-url>/api/ingest`. Requires the app to
   be deployed (M8) — wire the workflow now, enable/verify after deploy.
3. Add `CRON_SECRET` to the GitHub repo's Actions secrets.

Acceptance:

- `/digest` shows sensible 2-day groupings locally.
- After M8's deploy: a manually dispatched workflow run returns 200 and new
  articles appear; scheduled runs green for a day.
- `bun run check` green.

Out of scope: email of any kind; per-user digest cadence settings.
