# M1 — Data model on Neon (completed 2026-07-02)

Goal: real schema migrated against a Neon Postgres database, with a Prisma
client singleton the app can import.

Spec: `../../design-docs/rankwire-design.md` §6.

## Done

- `prisma/schema.prisma`: Auth.js adapter models (`User`, `Account`,
  `Session`; `VerificationToken` omitted — it serves email/magic-link flows
  only and this app is Google SSO only) plus `Article`, `Vote`, `TagWeight`,
  `ArticleScore` exactly as spec §6, with `onDelete: Cascade` on every
  relation into `User` and `Article`.
- Initial migration (`20260702060853_init`) created and applied on Neon;
  tables verified by scratch query (all 7 + `_prisma_migrations`).
- `lib/db.ts`: client singleton importing from `app/generated/prisma/client`
  (not `@prisma/client`), constructed with `PrismaPg` and cached on
  `globalThis` outside production.
- `prisma/seed.ts`: exports `DEFAULT_TAG_WEIGHTS` (spec §9) and
  `seedTagWeights(userId)` for M2's first-sign-in seeding; run directly (or
  via `prisma db seed`, wired in `prisma.config.ts`) it idempotently seeds a
  dev user — verified against Neon (1 user, 15 tag weights).
- `build` script is now `prisma generate && next build` (generated client is
  gitignored, so CI/deploy must regenerate). Verified: `bun run build` and
  `bun run check` both green.

## Decisions recorded during the build

- **Prisma 7 requires a driver adapter at runtime** (per installed
  `@prisma/client@7.8.0` types: "Since Prisma 7, a PrismaClient needs either
  an adapter or an accelerateUrl"). Chose **`@prisma/adapter-pg`** with the
  pooled `DATABASE_URL` — Node runtime only, so TCP `pg` is the simplest
  path; swap to `@prisma/adapter-neon` only if an edge runtime ever enters
  the picture.
- **Migrations need Neon's direct endpoint** (Prisma Migrate's session-level
  advisory locks fail through PgBouncer), and Prisma 7's `defineConfig` has no
  `directUrl` field. Since `prisma.config.ts` is CLI-only in Prisma 7 (the
  runtime connects via the adapter), it now reads
  `DIRECT_DATABASE_URL ?? DATABASE_URL`; `DIRECT_DATABASE_URL` (pooled string
  with the `-pooler` host suffix removed) added to `.env` / `.env.example`
  and spec §10.
- `pg` emits an sslmode deprecation warning (`prefer`/`require` treated as
  `verify-full` until pg v9) on connect; harmless with Neon's `sslmode=require`
  string, revisit if pg 9 lands.

Out of scope (unchanged): auth wiring, any UI, ingestion.
