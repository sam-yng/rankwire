# M8 — Deploy + portfolio polish

Goal: publicly reachable, presentable portfolio piece.

Steps:

1. Deploy to Vercel (read the bundled deploying guide): set `DATABASE_URL`,
   `AUTH_SECRET`, `AUTH_GOOGLE_ID/SECRET`, `CRON_SECRET` env vars; add the
   production redirect URI to the Google OAuth client; ensure
   `prisma generate` runs in the build.
2. Point M7's ingest workflow at the production URL and verify scheduled runs.
3. Polish pass: metadata/OG tags, favicon, responsive check, dark mode,
   loading/error states (`loading.tsx`, `error.tsx`).
4. Rewrite `README.md` for the portfolio: what it is, architecture sketch,
   stack, screenshots, local setup (`bun install`, `.env` from `.env.example`,
   `bunx prisma migrate dev`, `bun dev`).
5. Docs gardening: `bunx h-alter docs-sanity . --fix-generated`; move shipped
   plans to `docs/exec-plans/completed/`.

Acceptance:

- A stranger can sign in with Google on the production URL and browse a live,
  ranked feed that updates hourly.
- CI green on `main`; `bun run check` green locally.
