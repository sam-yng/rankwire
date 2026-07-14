import { describe, expect, test } from "bun:test";
import {
  getPreferences,
  InvalidPreferencesError,
  type PreferencesStore,
  type PreferencesTransaction,
  type PreferenceValue,
  savePreferences,
  validatePreferenceValues,
} from "./preferences";
import type { RankedArticle, ScoreRow } from "./ranking";
import { DEFAULT_TAG_WEIGHTS, TAG_NAMES } from "./tags";

function allValues(weight = 0): PreferenceValue[] {
  return TAG_NAMES.map((tag) => ({ tag, weight }));
}

function fakeStore() {
  const weights = new Map<string, number>([
    ["viewer:mcp", 1.5],
    ["other-user:mcp", 9],
  ]);
  const articles: RankedArticle[] = [
    { id: "article-1", tags: ["mcp"] },
    { id: "article-2", tags: ["new-tech"] },
  ];
  const calls = {
    reads: [] as string[],
    transactions: 0,
    upserts: [] as { userId: string; values: PreferenceValue[] }[],
    weightScopes: [] as string[][],
    scoreUpserts: [] as ScoreRow[][],
  };
  const tx: PreferencesTransaction = {
    async upsertTagWeights(userId, values) {
      calls.upserts.push({ userId, values: [...values] });
      for (const value of values) weights.set(`${userId}:${value.tag}`, value.weight);
    },
    async listUserIds() {
      return ["viewer", "other-user"];
    },
    async loadTagWeights(userIds) {
      calls.weightScopes.push([...userIds]);
      return [...weights.entries()]
        .map(([key, weight]) => {
          const [userId, tag] = key.split(":");
          return { userId: userId ?? "", tag: tag ?? "", weight };
        })
        .filter((row) => userIds.includes(row.userId));
    },
    async loadArticles() {
      return articles;
    },
    async upsertScores(rows) {
      calls.scoreUpserts.push([...rows]);
    },
  };
  const store: PreferencesStore = {
    async listTagWeights(userId) {
      calls.reads.push(userId);
      return [...weights.entries()]
        .filter(([key]) => key.startsWith(`${userId}:`))
        .map(([key, weight]) => ({ tag: key.slice(userId.length + 1), weight }));
    },
    async transaction(operation) {
      calls.transactions += 1;
      return operation(tx);
    },
  };

  return { store, calls, weights };
}

describe("getPreferences", () => {
  test("returns taxonomy order and fills missing rows from defaults", async () => {
    const { store, calls } = fakeStore();

    const result = await getPreferences("viewer", store);

    expect(calls.reads).toEqual(["viewer"]);
    expect(result.map(({ tag }) => tag)).toEqual(TAG_NAMES);
    expect(result.find(({ tag }) => tag === "mcp")?.weight).toBe(1.5);
    expect(result.find(({ tag }) => tag === "agentic-development")?.weight).toBe(
      DEFAULT_TAG_WEIGHTS["agentic-development"],
    );
  });
});

describe("validatePreferenceValues", () => {
  test("accepts every taxonomy tag exactly once and normalizes order", () => {
    const input = allValues(2).reverse();
    expect(validatePreferenceValues(input)).toEqual(allValues(2));
  });

  test("rejects missing, duplicate, unknown, and non-finite values", () => {
    const missing = allValues().slice(1);
    const duplicate = allValues();
    duplicate[0] = { ...duplicate[1] };
    const unknown = allValues();
    unknown[0] = { tag: "unknown" as PreferenceValue["tag"], weight: 0 };
    const nonFinite = allValues();
    nonFinite[0] = { ...nonFinite[0], weight: Number.NaN };

    for (const invalid of [missing, duplicate, unknown, nonFinite]) {
      expect(() => validatePreferenceValues(invalid)).toThrow(InvalidPreferencesError);
    }
  });
});

describe("savePreferences", () => {
  test("upserts and rescores only the selected viewer inside one transaction", async () => {
    const { store, calls, weights } = fakeStore();
    const values = allValues();
    values[TAG_NAMES.indexOf("mcp")] = { tag: "mcp", weight: 3 };

    await savePreferences("viewer", values, store);

    expect(calls.transactions).toBe(1);
    expect(calls.upserts).toEqual([{ userId: "viewer", values }]);
    expect(calls.weightScopes).toEqual([["viewer"]]);
    expect(calls.scoreUpserts[0]).toEqual([
      { userId: "viewer", articleId: "article-1", score: 3 },
      { userId: "viewer", articleId: "article-2", score: 0 },
    ]);
    expect(weights.get("other-user:mcp")).toBe(9);
  });
});
