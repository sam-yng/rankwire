import { describe, expect, test } from "bun:test";
import type { RankedArticle, ScoreRow } from "./ranking";
import {
  ArticleNotFoundError,
  type CastVoteInput,
  castVote,
  type VoteStore,
  type VoteTransaction,
  type VoteValue,
  voteWeightAdjustment,
} from "./votes";

function fakeStore(options?: {
  articleTags?: string[] | null;
  previousValue?: VoteValue | null;
}) {
  const articles: RankedArticle[] = [
    { id: "article-1", tags: options?.articleTags ?? ["mcp", "new-tech"] },
    { id: "article-2", tags: ["mcp"] },
  ];
  const calls = {
    transactions: 0,
    articleIds: [] as string[],
    voteLookups: [] as { userId: string; articleId: string }[],
    voteUpserts: [] as CastVoteInput[],
    increments: [] as { userId: string; tags: string[]; adjustment: number }[],
    weightScopes: [] as string[][],
    articleScopes: [] as (string[] | undefined)[],
    scoreUpserts: [] as ScoreRow[][],
  };
  const tx: VoteTransaction = {
    async findArticleTags(articleId) {
      calls.articleIds.push(articleId);
      if (options?.articleTags === null) return null;
      return articles.find((article) => article.id === articleId)?.tags ?? null;
    },
    async findVoteValue(userId, articleId) {
      calls.voteLookups.push({ userId, articleId });
      return options?.previousValue ?? null;
    },
    async upsertVote(input) {
      calls.voteUpserts.push(input);
    },
    async incrementTagWeights(userId, tags, adjustment) {
      calls.increments.push({ userId, tags: [...tags], adjustment });
    },
    async listUserIds() {
      return ["viewer", "other-user"];
    },
    async loadTagWeights(userIds) {
      calls.weightScopes.push([...userIds]);
      return [
        { userId: "viewer", tag: "mcp", weight: 2 },
        { userId: "other-user", tag: "mcp", weight: 9 },
      ].filter((weight) => userIds.includes(weight.userId));
    },
    async loadArticles(articleIds) {
      calls.articleScopes.push(articleIds ? [...articleIds] : undefined);
      return articleIds
        ? articles.filter((article) => articleIds.includes(article.id))
        : articles;
    },
    async upsertScores(rows) {
      calls.scoreUpserts.push([...rows]);
    },
  };
  const store: VoteStore = {
    async transaction(operation) {
      calls.transactions += 1;
      return operation(tx);
    },
  };

  return { store, calls };
}

describe("voteWeightAdjustment", () => {
  test("applies a half-point signal for a first vote", () => {
    expect(voteWeightAdjustment(null, 1)).toBe(0.5);
    expect(voteWeightAdjustment(null, -1)).toBe(-0.5);
  });

  test("is idempotent when the selected vote is repeated", () => {
    expect(voteWeightAdjustment(1, 1)).toBe(0);
    expect(voteWeightAdjustment(-1, -1)).toBe(0);
  });

  test("fully reverses the previous signal when a vote is flipped", () => {
    expect(voteWeightAdjustment(1, -1)).toBe(-1);
    expect(voteWeightAdjustment(-1, 1)).toBe(1);
  });
});

describe("castVote", () => {
  test("upserts a first vote, adjusts its tags, and rescoring stays viewer-scoped", async () => {
    const { store, calls } = fakeStore();

    const result = await castVote(
      { userId: "viewer", articleId: "article-1", value: 1 },
      store,
    );

    expect(result).toEqual({
      articleId: "article-1",
      value: 1,
      previousValue: null,
      weightAdjustment: 0.5,
    });
    expect(calls.transactions).toBe(1);
    expect(calls.voteUpserts).toEqual([
      { userId: "viewer", articleId: "article-1", value: 1 },
    ]);
    expect(calls.increments).toEqual([
      { userId: "viewer", tags: ["mcp", "new-tech"], adjustment: 0.5 },
    ]);
    expect(calls.weightScopes).toEqual([["viewer"]]);
    expect(calls.articleScopes).toEqual([undefined]);
    expect(calls.scoreUpserts[0]).toEqual([
      { userId: "viewer", articleId: "article-1", score: 2 },
      { userId: "viewer", articleId: "article-2", score: 2 },
    ]);
  });

  test("repeating a vote skips weight writes but still repairs scores", async () => {
    const { store, calls } = fakeStore({ previousValue: -1 });

    const result = await castVote(
      { userId: "viewer", articleId: "article-1", value: -1 },
      store,
    );

    expect(result.weightAdjustment).toBe(0);
    expect(calls.voteUpserts).toHaveLength(1);
    expect(calls.increments).toEqual([]);
    expect(calls.scoreUpserts).toHaveLength(1);
  });

  test("flipping a vote applies only the differential adjustment", async () => {
    const { store, calls } = fakeStore({ previousValue: 1 });

    await castVote({ userId: "viewer", articleId: "article-1", value: -1 }, store);

    expect(calls.increments).toEqual([
      { userId: "viewer", tags: ["mcp", "new-tech"], adjustment: -1 },
    ]);
  });

  test("missing articles fail before any vote, weight, or score write", async () => {
    const { store, calls } = fakeStore({ articleTags: null });

    const operation = castVote(
      { userId: "viewer", articleId: "missing", value: 1 },
      store,
    );

    await expect(operation).rejects.toBeInstanceOf(ArticleNotFoundError);
    expect(calls.voteLookups).toEqual([]);
    expect(calls.voteUpserts).toEqual([]);
    expect(calls.increments).toEqual([]);
    expect(calls.scoreUpserts).toEqual([]);
  });
});
