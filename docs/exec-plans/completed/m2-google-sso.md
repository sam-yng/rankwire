# M2 — Google SSO (Auth.js)

Goal: sign in with Google, sessions available to server components and route
handlers, default tag weights seeded on first sign-in.

Spec: `../../design-docs/young-post-design.md` §1, §9, §11. Read the bundled
Next.js authentication guide (`node_modules/next/dist/docs/01-app/02-guides/authentication.md`)
before wiring — this Next version may differ from training data.

## Carry-over constraints from M0/M1 (see `../completed/`)

- Prisma client imports from `@/app/generated/prisma/client`, never
  `@prisma/client`; always go through the `lib/db.ts` singleton (Prisma 7
  requires the driver adapter). If `PrismaAdapter(db)`'s types (written
  against `@prisma/client`) reject the generated client, cast at the adapter
  boundary only — do not change `lib/db.ts`.
- `VerificationToken` was deliberately omitted from the schema (M1 decision):
  it serves email/magic-link flows only. Do not re-add it for Google-only
  OAuth.
- `@prisma/adapter-pg` is TCP/Node-only: no DB-backed session checks in
  request interception. Note this Next version replaced `middleware.ts` with
  `proxy.ts`; per the bundled auth guide, protect personalised pages with
  per-page/DAL checks rather than proxy (layouts don't re-render on
  navigation, so a layout-only gate is unsafe too).
- `.env.example` already lists `AUTH_SECRET` / `AUTH_GOOGLE_ID` /
  `AUTH_GOOGLE_SECRET` (M0); Auth.js v5 auto-reads these exact names, so no
  explicit `clientId`/`clientSecret` wiring is needed.
- Version check (2026-07-03): `next-auth@5.0.0-beta.31` peer range includes
  Next 16 (`^14 || ^15 || ^16`) — install `next-auth@beta`, not v4.

## Steps

1. Google Cloud Console: OAuth client (web application), authorized redirect
   `http://localhost:3000/api/auth/callback/google` for local dev plus the
   deployed URL later; fill `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` in `.env`;
   generate `AUTH_SECRET` (`openssl rand -base64 32`).
2. `bun add next-auth@beta @auth/prisma-adapter`; `lib/auth.ts` exporting
   `{ handlers, auth, signIn, signOut }` from `NextAuth({ adapter:
   PrismaAdapter(db), providers: [Google] })` — Google provider only,
   database session strategy (adapter default; `Session` model already
   migrated in M1, no schema change expected).
3. `app/api/auth/[...nextauth]/route.ts` re-exporting `handlers`;
   `app/signin/page.tsx` with the Google button (server action calling
   `signIn("google")`); sign-out affordance in the layout header (server
   action calling `signOut()`), shown only when a session exists.
4. First-sign-in seeding: Auth.js `events.createUser` (config event, not an
   adapter method) calls the existing `seedTagWeights(userId)` from
   `prisma/seed.ts` — already idempotent via `skipDuplicates`, which covers
   the "not re-seeded on later sign-ins" acceptance.
5. Session helper for server components/handlers: `auth()` plus a
   `requireSession()` wrapper that redirects unauthenticated visitors to
   `/signin`; personalised pages call it per-page.

## Acceptance

- Full round-trip locally: sign in with a real Google account, session visible,
  `TagWeight` rows created once (not re-seeded on later sign-ins), sign out.
- `bun run check` green.

Out of scope: any other provider, email flows, role/permission systems.
