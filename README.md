# Rankwire

[Rankwire](https://www.rankwire.com.au) is a multi-user engineering-news
aggregator. It pulls selected RSS and Atom sources hourly, ranks articles for
each signed-in reader, then learns from their thumbs up/down votes. Google SSO
keeps the experience deliberately personal.

![Rankwire social preview](https://www.rankwire.com.au/opengraph-image)

## Architecture

```text
RSS / Atom sources → ingestion → Postgres articles → per-user scores
                                               ↑             ↓
                                      votes + preferences ← feed + digest
```

The ingest endpoint fetches sources concurrently, deduplicates articles by URL,
and recomputes scores only for newly ingested articles. Voting and preference
changes rescore only the current reader's feed. The digest derives fixed
two-day windows at read time; no duplicate digest data or scheduled email job.

## Stack

- Next.js App Router + TypeScript
- Auth.js v5 with Google OAuth
- Prisma 7 + Neon Postgres
- Tailwind CSS v4
- Bun
- GitHub Actions hourly scheduler

## Local setup

```bash
bun install
cp .env.example .env
bunx prisma migrate dev
bun dev
```

Populate `.env` from `.env.example` with Neon, Google OAuth, Auth.js, and cron
values. Root (`/`) is the sign-in page; signed-in reading lives at `/feed` and
`/digest`.

## Production operations

Before deploying a schema change, apply migrations against Neon's direct
connection:

```bash
DIRECT_DATABASE_URL='...' bunx prisma migrate deploy
```

Vercel needs `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
`AUTH_GOOGLE_SECRET`, and `CRON_SECRET`. Set Google OAuth's production callback
to `https://www.rankwire.com.au/api/auth/callback/google`. GitHub Actions also
needs repository variable `APP_URL` and secret `CRON_SECRET`; the workflow runs
at minute 17 each hour and POSTs `/api/ingest`.

## Quality checks

```bash
bun run check
bun run build
```

Design and delivery record: [build spec](docs/design-docs/rankwire-design.md),
[active plans](docs/exec-plans/active), and
[@samyng/h-alter](https://www.npmjs.com/package/@samyng/h-alter) harness.
