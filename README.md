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
values. For production, configure the same runtime variables in Vercel and set
the Google OAuth redirect URI to
`https://www.rankwire.com.au/api/auth/callback/google`.

## Quality checks

```bash
bun run check
bun run build
```

Design and delivery record: [build spec](docs/design-docs/rankwire-design.md),
[active plans](docs/exec-plans/active), and
[@samyng/h-alter](https://www.npmjs.com/package/@samyng/h-alter) harness.
