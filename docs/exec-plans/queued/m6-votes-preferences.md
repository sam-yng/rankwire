# M6 — Votes + tag preferences

Goal: the feedback loop — voting adjusts the voter's tag weights and re-ranks
their feed; preferences are directly editable.

Spec: `../../design-docs/young-post-design.md` §8, §9, §11.

Steps:

1. `app/api/vote/route.ts` (or a server action — pick per the bundled
   mutating-data guide): session-authed; Zod-validated
   `{ articleId, value: 1 | -1 }`; upsert `Vote` (`@@unique([userId,
   articleId])`), apply `weight += value * 0.5` per article tag for the voter,
   rescore that user's articles.
2. `VoteButtons` client component on `ArticleCard` with optimistic state;
   voted state visible on reload.
3. `app/preferences/page.tsx`: the user's 15 tag weights, editable (sliders or
   steppers); saving rescoring the user's feed.
4. Tests: vote upsert semantics (changing a vote doesn't double-apply deltas —
   decide and test the delta reversal rule), weight adjustment, rescore
   trigger. Update the guard baseline honestly.

Acceptance:

- Voting up an `mcp`-tagged article raises the user's `mcp` weight and visibly
  reorders their feed; a second opposite vote doesn't corrupt weights.
- Another user's feed/weights are untouched.
- `bun run check` green.

Out of scope: vote-count displays, comment/social features.
