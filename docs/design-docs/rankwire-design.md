# Rankwire — engineering-news aggregator, build spec

Supersedes the original planning handoff (2026-07-02). All previously open
decisions are now resolved; the deltas from the original brief are listed in §1.
Treat this as the source of truth. Implementation is broken into bite-sized
exec plans under `docs/exec-plans/` — see the active roadmap in
`../exec-plans/active/`.

## 1. Decisions and scope changes (2026-07-02)

| Decision | Resolution |
|---|---|
| Postgres provider | **Neon** (free tier, pooled connection string) |
| Scheduling | **GitHub Actions** scheduled workflows (not Vercel Cron) |
| Ranking v1 | **Precompute** in a batch step after ingestion (not compute-on-read) |
| Anthropic feed | **Official feed only — none exists as of 2026-07-02** (verified: no RSS/Atom on anthropic.com/news or claude.com/blog, no feed-discovery `<link>` tags, only community scrapers). Recorded as *add-when-available*; no unofficial feeds. Simon Willison's feed is the interim stand-in. No other new feeds for now. |
| Digest cadence | **Every second day** (see §8 — email is out of scope, so the digest ships as an in-app view over 2-day windows) |
| Email | **Removed from scope.** Resend + React Email dropped entirely. |
| Auth | **Added: Google SSO only**, via Auth.js. Multi-user portfolio piece: anyone can sign in with their Google account and gets their own votes, tag weights, and ranked feed. |

## 2. What this is

A multi-user engineering-news aggregator, closer in spirit to daily.dev than a
curated newsletter: RSS/Atom feeds are pulled automatically on a schedule,
articles are ranked against each user's own interest profile (which improves
via thumbs up/down voting), and served as a personalised web feed plus an
in-app digest view. Sign-in is Google SSO only.

## 3. Stack (decided)

- **Next.js (App Router) + TypeScript** — this repo pins a Next.js version with
  breaking changes vs. common knowledge; **read the guides in
  `node_modules/next/dist/docs/` before writing code** (see `CLAUDE.md`).
- **Bun** — package manager and script runner.
- **Prisma 7 + Postgres (Neon)** — note Prisma 7 conventions already scaffolded:
  `prisma.config.ts` (dotenv-loaded datasource URL) and the `prisma-client`
  generator emitting to `app/generated/prisma` (gitignored; run
  `prisma generate` after install/schema changes).
- **Auth.js with the Google provider + Prisma adapter** — Google SSO only, no
  credentials or email flows.
- **Tailwind CSS v4** — styling.
- **`rss-parser`** — feed fetching/parsing (RSS and Atom). Not yet installed;
  added in the ingestion milestone.
- **Zod** — validate anything from feeds or form submissions.
- **GitHub Actions** — scheduled workflow triggers ingestion (hourly); the
  h-alter CI gate (`.github/workflows/check.yml`) runs `bun run check`.
- **h-alter Standard harness** — system-of-record docs, gate, hooks, plan
  lifecycle, test-integrity guard. See `AGENTS.md`.

## 4. Architecture

```
Sources (RSS/Atom) → Ingestion → Dedup & store → Precompute per-user scores
                                                        │
                                    votes / tag prefs ──┤ (feedback refines
                                                        ▼  the ranking)
                                              Per-user feed + digest view
```

- `/api/ingest` (cron-triggered, `CRON_SECRET` header): fetch feeds, parse,
  dedupe by URL, store, then recompute `ArticleScore` for all users.
- Feed page (server component): reads precomputed per-user scores; cheap reads.
- Votes (authenticated): create a `Vote`, adjust that user's `TagWeight`s,
  recompute that user's affected scores.
- Digest page: articles grouped into 2-day windows, top-N per window by the
  viewer's scores.

## 5. Project structure (target)

```
rankwire/
├── app/
│   ├── page.tsx                   # personalised article feed
│   ├── layout.tsx
│   ├── digest/page.tsx            # in-app digest (2-day windows)
│   ├── preferences/page.tsx       # per-user tag-weight editor
│   ├── signin/page.tsx            # Google SSO entry
│   ├── components/                # ArticleCard, VoteButtons, FeedList, …
│   ├── generated/prisma/          # generated client (gitignored)
│   └── api/
│       ├── auth/[...nextauth]/route.ts   # Auth.js handlers
│       ├── ingest/route.ts        # cron: fetch, parse, dedupe, store, rescore
│       └── vote/route.ts          # POST thumbs up/down (session-authed)
├── lib/
│   ├── auth.ts                    # Auth.js config (Google provider)
│   ├── sources.ts                 # feed list + tags (§7)
│   ├── ingest.ts                  # fetch/parse/dedupe (§6)
│   ├── ranking.ts                 # v1 tag-weight scoring, precompute batch
│   └── db.ts                      # Prisma client singleton
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                    # default tag weights (§9)
├── prisma.config.ts
├── .github/workflows/
│   ├── check.yml                  # h-alter gate (exists)
│   └── ingest.yml                 # hourly POST /api/ingest with CRON_SECRET
├── docs/                          # h-alter system-of-record
└── .agents/                       # h-alter skills, scripts, guardrails
```

## 6. Data model

Multi-user version of the original single-user model. Auth.js adapter models
(`User`, `Account`, `Session`) join the domain models; exact field lists follow
the Auth.js Prisma adapter reference at implementation time.

```prisma
model Article {
  id          String   @id @default(cuid())
  url         String   @unique          // dedupe via upsert on url
  title       String
  summary     String?
  source      String
  tags        String[]
  publishedAt DateTime
  createdAt   DateTime @default(now())
  votes       Vote[]
  scores      ArticleScore[]
}

model Vote {
  id        String   @id @default(cuid())
  userId    String
  articleId String
  value     Int      // +1 or -1
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  article   Article  @relation(fields: [articleId], references: [id])

  @@unique([userId, articleId])   // one vote per user per article (upsert to change)
}

model TagWeight {
  userId String
  tag    String
  weight Float  @default(0)
  user   User   @relation(fields: [userId], references: [id])

  @@id([userId, tag])
}

model ArticleScore {
  userId    String
  articleId String
  score     Float
  user      User    @relation(fields: [userId], references: [id])
  article   Article @relation(fields: [articleId], references: [id])

  @@id([userId, articleId])
  @@index([userId, score])
}
```

Changes vs. the original: `Article.score` and `Article.emailedAt` are gone
(scores are per-user in `ArticleScore`; nothing is emailed). `Vote` and
`TagWeight` are per-user. New users get the default tag weights (§9) seeded on
first sign-in.

## 7. Ingestion + source list

Ingestion logic is unchanged from the original brief: `Promise.allSettled`
across sources so one dead feed never kills the run; normalize each item to
`{ url, title, summary, source, tags, publishedAt }`; dedupe with
`db.article.upsert` on the unique `url` (`update: {}`). Feeds that give only a
snippet are correct behavior — link out, never republish.

Start with these sources (unchanged); expand deliberately only after ranking
has vote signal to work with:

| Source | Tags |
|---|---|
| Julia Evans — jvns.ca/atom.xml | new-tech |
| Simon Willison — simonwillison.net/atom/everything/ | ai-coding-tools, new-tech |
| Martin Fowler — martinfowler.com/feed.atom | new-tech |
| GitHub Blog — github.blog/feed/ | ai-coding-tools, trending-repos |
| Netflix Tech Blog — netflixtechblog.com/feed | new-tech |
| CSS-Tricks — css-tricks.com/feed/ | frontend-development |
| Smashing Magazine — smashingmagazine.com/feed/ | frontend-development |
| dev.to webdev — dev.to/feed/tag/webdev | frontend-development |
| Evil Martians — evilmartians.com/chronicles.rss | frontend-development |
| Hacker News 150+ — hnrss.org/frontpage?points=150 | new-tech, trending-repos |
| Lobsters — lobste.rs/rss | new-tech |
| Stack Overflow Blog — stackoverflow.blog/feed/ | new-tech, dev-tooling |

**Anthropic feed (decided 2026-07-02):** official feed only, and none exists
yet — anthropic.com and claude.com expose no RSS/Atom endpoints or
feed-discovery links; only community scrapers exist and are excluded by
decision. Re-check occasionally; when an official feed ships, add it with tags
`["anthropic", "ai-coding-tools"]`. Until then Simon Willison's feed covers
most Claude/Anthropic/MCP news. Cursor's blog is excluded for the same reason.

## 8. Ranking + digest

- **v1 (build first, decided: precompute):** after each ingestion run, score
  every (user, new-article) pair by summing the user's `TagWeight.weight` for
  each tag on the article; write `ArticleScore` rows. After a vote or a
  preference edit, recompute that user's scores (their tag weights changed).
- **Vote contract:** `POST /api/vote { articleId, value: 1 | -1 }`,
  session-authenticated. Upserts the `Vote`, applies
  `weight += value * DELTA` (DELTA = 0.5) to the user's `TagWeight` for each
  tag on the article, then rescoring.
- **v2/v3 (later, unchanged):** embedding-based profile vector; optional LLM
  scoring. Not in the first version.
- **Digest (decided: every second day, in-app):** `/digest` groups articles
  into 2-day windows and shows the viewer's top 8–12 per window by score. No
  email; no `emailedAt` bookkeeping. A GitHub Actions digest workflow is
  unnecessary since windows are derived from `publishedAt` at read time.

## 9. Tag taxonomy (unchanged) + per-user seeding

Fifteen tags, derived from the owner's repos: `agentic-development`,
`harness-engineering`, `ai-coding-tools`, `anthropic`, `mcp`, `rag-retrieval`,
`local-ai`, `frontend-development`, `nextjs`, `typescript`,
`postgres-supabase`, `dev-tooling`, `testing-quality`, `trending-repos`,
`new-tech`.

Default weights seeded **per user on first sign-in** (and editable on
`/preferences`): agentic-development 2, harness-engineering 2, mcp 1.5,
anthropic 1.5, rag-retrieval 1, local-ai 1, everything else 0.

## 10. Environment variables

See `.env.example`: `DATABASE_URL` (Neon pooled), `DIRECT_DATABASE_URL` (Neon
direct/unpooled — CLI-only, Prisma Migrate can't run through the PgBouncer
pooler), `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `CRON_SECRET`.
`RESEND_*` and `DIGEST_RECIPIENT_EMAIL` are gone with email.

## 11. Route protection

- `/api/ingest` — `CRON_SECRET` in a request header (machine caller).
- `/api/vote`, `/preferences` — Auth.js session required.
- Feed and digest pages — session required (they are personalised); `/signin`
  is the only public page.
