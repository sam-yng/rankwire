# M4 — Ranking v1 (precompute)

Goal: per-user precomputed scores written after every ingestion run.

Spec: `../../design-docs/young-post-design.md` §8.

Steps:

1. `lib/ranking.ts`:
   - `scoreArticle(tags, weightsByTag)` — pure: sum of the user's weights for
     the article's tags.
   - `rescoreForUsers(userIds, articleIds?)` — batch: load weights, upsert
     `ArticleScore` rows; scoped variants for "new articles, all users"
     (post-ingest) and "all articles, one user" (post-vote/pref-edit).
2. Call the post-ingest rescore at the end of `runIngestion()` so the cron hit
   does both.
3. Unit tests for the pure scoring and for rescore scoping; update the
   test-integrity baseline via the honest path.

Acceptance:

- After an ingest run, every (user, article) pair has an `ArticleScore`; a
  user with the default seed weights scores an `agentic-development` article
  above an untagged-interest one.
- `bun run check` green.

Out of scope: v2 embeddings, v3 LLM scoring, any UI.
