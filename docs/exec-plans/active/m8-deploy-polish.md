# M8 — Deploy + portfolio polish

Status: active (started 2026-07-16).

Goal: make Rankwire publicly reachable, presentable, and operational as a
portfolio piece.

## Current production state

- Production origin: `https://www.rankwire.com.au`; unauthenticated `/` safely
  redirects to `/signin` (checked 2026-07-16).
- GitHub Actions `APP_URL` correctly targets production.
- Manual ingestion initially returned HTTP 401; a later run reached ingestion and
  exposed Prisma `P2028`: score upserts exceeded Prisma's five-second batch
  transaction timeout. The code fix awaits deployment.
- Google sign-in, database reads, and a full authenticated feed cannot be
  verified without a test Google account/session.

## Delivery slices

1. Production configuration:
   - verify Vercel has `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
     `AUTH_GOOGLE_SECRET`, and a `CRON_SECRET` matching GitHub Actions;
   - ensure production build runs `prisma generate` (already included in
     `package.json` build script);
   - confirm Google OAuth production callback URI is
     `https://www.rankwire.com.au/api/auth/callback/google`.
2. Ingestion verification:
   - rerun manual workflow after secret alignment; confirm HTTP 200 and newly
     ingested articles;
   - observe hourly scheduled workflow green for one day; then complete M7.
3. Portfolio polish:
   - add canonical, Open Graph, Twitter, theme-colour, and favicon metadata;
   - add generated social card plus responsive dark-mode loading/error states;
   - inspect desktop and mobile sign-in presentation.
4. Documentation and closure:
   - rewrite README for visitors with architecture, stack, visual preview, and
     local setup;
   - run `bunx h-alter docs-sanity . --fix-generated`;
   - move shipped plans to `completed/` only after their acceptance work ends.

## Progress

- [x] Reconcile production origin and scheduled-ingest state.
- [x] Activate M8 and record live configuration mismatch without exposing a secret.
- [x] Add production metadata, social image, favicon, loading, and error states.
- [x] Rewrite README for portfolio visitors.
- [x] Align Vercel and GitHub Actions `CRON_SECRET`.
- [x] Raise score-upsert batch transaction timeout to prevent Prisma `P2028`.
- [ ] Verify Google sign-in and authenticated feed on production.
- [ ] Verify a manual ingestion and one day of scheduled ingestions; complete M7.
- [x] Run docs sanity, full checks, production build, and visual review.

## Acceptance

- A stranger can sign in with Google on production and browse a live ranked feed.
- Scheduled ingestion updates production hourly with successful runs.
- Metadata, social image, favicon, dark mode, loading, error, responsive states,
  and portfolio README are present and verified.
- `bun run check` and `bun run build` pass; CI is green on `main`.

## Verification log

- 2026-07-16: `bunx h-alter docs-sanity . --fix-generated` reported no
  findings. `bun run check` passed (38 tests, 107 assertions) and `bun run
  build` passed, including static generation of `/opengraph-image`.
- 2026-07-16: local production server returned HTTP 200 `image/png` for
  `/opengraph-image`; rendered metadata includes canonical, Open Graph, Twitter,
  and light/dark theme-colour tags. Live production sign-in was visually checked
  at a 390×844 viewport in dark mode; label, copy, and Google button remained
  visible and usable.
- 2026-07-16: production `/api/ingest` accepted GitHub Actions authentication
  but score upserts failed with Prisma `P2028` after the five-second default
  batch-transaction timeout. Set explicit 30-second timeout in `lib/ranking.ts`;
  deploy and rerun manual ingestion to verify.
