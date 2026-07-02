# M1 — Data model on Neon

Goal: real schema migrated against a Neon Postgres database, with a Prisma
client singleton the app can import.

Spec: `../../design-docs/young-post-design.md` §6.

Steps:

1. Create the Neon project (free tier); put the pooled connection string in
   `.env` as `DATABASE_URL` (never committed; `.env.example` documents it).
2. Write `prisma/schema.prisma`: Auth.js adapter models (`User`, `Account`,
   `Session` — follow the adapter reference for exact fields) plus `Article`,
   `Vote`, `TagWeight`, `ArticleScore` as specced.
3. `bunx prisma migrate dev` to create and apply the initial migration;
   `bunx prisma generate` (client emits to `app/generated/prisma`).
4. `lib/db.ts`: Prisma client singleton (globalThis pattern so `next dev`
   hot-reload doesn't leak connections; import from the generated client path,
   not `@prisma/client`).
5. `prisma/seed.ts`: exports the default tag-weight table from the spec §9 —
   used by M2's first-sign-in seeding, and can seed a dev user for testing.
6. Add `prisma generate` where the build needs it (e.g. before `next build`).

Acceptance:

- Migration applied on Neon; `bunx prisma studio` (or a scratch script) shows
  the tables.
- `bun run check` green. First real unit-testable code lands next milestone;
  no test stage yet.

Out of scope: auth wiring, any UI, ingestion.
