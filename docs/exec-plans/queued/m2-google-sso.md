# M2 — Google SSO (Auth.js)

Goal: sign in with Google, sessions available to server components and route
handlers, default tag weights seeded on first sign-in.

Spec: `../../design-docs/young-post-design.md` §1, §9, §11. Read the bundled
Next.js authentication guide (`node_modules/next/dist/docs/01-app/02-guides/authentication.md`)
before wiring — this Next version may differ from training data.

Steps:

1. Google Cloud Console: OAuth client (web), authorized redirect for local dev
   and the deployed URL; fill `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` /
   `AUTH_SECRET` in `.env`.
2. Install Auth.js + Prisma adapter; `lib/auth.ts` with the Google provider
   only, Prisma adapter against `lib/db.ts`.
3. `app/api/auth/[...nextauth]/route.ts` handlers; `app/signin/page.tsx` with
   the Google button; sign-out affordance in the layout header.
4. On user creation (adapter event), seed the user's `TagWeight` rows with the
   defaults from `prisma/seed.ts`.
5. Session helper for server components/handlers; redirect unauthenticated
   visitors of personalised pages to `/signin`.

Acceptance:

- Full round-trip locally: sign in with a real Google account, session visible,
  `TagWeight` rows created once (not re-seeded on later sign-ins), sign out.
- `bun run check` green.

Out of scope: any other provider, email flows, role/permission systems.
