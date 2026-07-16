import { describe, expect, test } from "bun:test";
import {
  type RankedArticle,
  type RankingStore,
  rescoreAllArticlesForUser,
  rescoreArticlesForAllUsers,
  rescoreForUsers,
  SCORE_UPSERT_TRANSACTION_TIMEOUT_MS,
  type ScoreRow,
  scoreArticle,
} from "./ranking";

function fakeStore(options?: {
  userIds?: string[];
  weights?: { userId: string; tag: string; weight: number }[];
  articles?: RankedArticle[];
}) {
  const userIds = options?.userIds ?? ["u1", "u2"];
  const weights = options?.weights ?? [
    { userId: "u1", tag: "agentic-development", weight: 2 },
    { userId: "u1", tag: "mcp", weight: 1.5 },
    { userId: "u2", tag: "mcp", weight: -1 },
  ];
  const articles = options?.articles ?? [
    { id: "a1", tags: ["agentic-development", "mcp"] },
    { id: "a2", tags: ["new-tech"] },
  ];
  const calls = {
    weightScopes: [] as string[][],
    articleScopes: [] as (string[] | undefined)[],
    upserts: [] as ScoreRow[][],
  };

  const store: RankingStore = {
    async listUserIds() {
      return userIds;
    },
    async loadTagWeights(ids) {
      calls.weightScopes.push([...ids]);
      return weights.filter((weight) => ids.includes(weight.userId));
    },
    async loadArticles(ids) {
      calls.articleScopes.push(ids ? [...ids] : undefined);
      return ids ? articles.filter((article) => ids.includes(article.id)) : articles;
    },
    async upsertScores(rows) {
      calls.upserts.push([...rows]);
    },
  };

  return { store, calls };
}

describe("scoreArticle", () => {
  test("gives production score upserts enough time for a cold database connection", () => {
    expect(SCORE_UPSERT_TRANSACTION_TIMEOUT_MS).toBe(30_000);
  });

  test("sums configured weights and treats missing tags as zero", () => {
    expect(
      scoreArticle(["agentic-development", "mcp", "new-tech"], {
        "agentic-development": 2,
        mcp: 1.5,
      }),
    ).toBe(3.5);
  });

  test("default seed weights rank agentic development above an unweighted tag", () => {
    const defaults = { "agentic-development": 2, "new-tech": 0 };
    expect(scoreArticle(["agentic-development"], defaults)).toBeGreaterThan(
      scoreArticle(["new-tech"], defaults),
    );
  });
});

describe("rescoreForUsers", () => {
  test("limits both user and article scope and upserts the cartesian product", async () => {
    const { store, calls } = fakeStore();

    const count = await rescoreForUsers(["u1"], ["a1"], store);

    expect(count).toBe(1);
    expect(calls.weightScopes).toEqual([["u1"]]);
    expect(calls.articleScopes).toEqual([["a1"]]);
    expect(calls.upserts).toEqual([[{ userId: "u1", articleId: "a1", score: 3.5 }]]);
  });

  test("omitted article scope loads every article for one user", async () => {
    const { store, calls } = fakeStore();

    const count = await rescoreAllArticlesForUser("u2", store);

    expect(count).toBe(2);
    expect(calls.articleScopes).toEqual([undefined]);
    expect(calls.upserts[0]).toEqual([
      { userId: "u2", articleId: "a1", score: -1 },
      { userId: "u2", articleId: "a2", score: 0 },
    ]);
  });

  test("post-ingestion scope loads all users for only supplied articles", async () => {
    const { store, calls } = fakeStore();

    const count = await rescoreArticlesForAllUsers(["a2"], store);

    expect(count).toBe(2);
    expect(calls.weightScopes).toEqual([["u1", "u2"]]);
    expect(calls.articleScopes).toEqual([["a2"]]);
    expect(calls.upserts[0]).toEqual([
      { userId: "u1", articleId: "a2", score: 0 },
      { userId: "u2", articleId: "a2", score: 0 },
    ]);
  });

  test("empty article scope performs no database work", async () => {
    const { store, calls } = fakeStore();

    const count = await rescoreArticlesForAllUsers([], store);

    expect(count).toBe(0);
    expect(calls.weightScopes).toEqual([]);
    expect(calls.articleScopes).toEqual([]);
    expect(calls.upserts).toEqual([]);
  });
});
