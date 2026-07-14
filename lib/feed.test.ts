import { describe, expect, test } from "bun:test";
import {
  FEED_PAGE_SIZE,
  type FeedArticle,
  type FeedStore,
  getFeedPage,
  parseFeedPage,
} from "./feed";

function article(index: number): FeedArticle {
  return {
    id: `article-${index}`,
    url: `https://example.com/${index}`,
    title: `Article ${index}`,
    summary: null,
    source: "Example",
    tags: ["new-tech"],
    publishedAt: new Date("2026-07-14T00:00:00.000Z"),
    score: index,
    vote: null,
  };
}

describe("parseFeedPage", () => {
  test("accepts positive integer query values", () => {
    expect(parseFeedPage("2")).toBe(2);
    expect(parseFeedPage("42")).toBe(42);
  });

  test("normalizes missing, repeated, fractional, zero, and negative values", () => {
    expect(parseFeedPage(undefined)).toBe(1);
    expect(parseFeedPage(["2", "3"])).toBe(1);
    expect(parseFeedPage("1.5")).toBe(1);
    expect(parseFeedPage("0")).toBe(1);
    expect(parseFeedPage("-2")).toBe(1);
  });
});

describe("getFeedPage", () => {
  test("scopes the query to the viewer and requests one lookahead row", async () => {
    const calls: Parameters<FeedStore["listRankedArticles"]>[0][] = [];
    const store: FeedStore = {
      async listRankedArticles(input) {
        calls.push(input);
        return Array.from({ length: FEED_PAGE_SIZE + 1 }, (_, index) => article(index));
      },
    };

    const result = await getFeedPage("viewer-1", 2, store);

    expect(calls).toEqual([
      { userId: "viewer-1", skip: FEED_PAGE_SIZE, take: FEED_PAGE_SIZE + 1 },
    ]);
    expect(result.articles).toHaveLength(FEED_PAGE_SIZE);
    expect(result.hasNextPage).toBe(true);
    expect(result.page).toBe(2);
  });

  test("returns an empty terminal page without a next link", async () => {
    const store: FeedStore = {
      async listRankedArticles() {
        return [];
      },
    };

    expect(await getFeedPage("viewer-1", 3, store)).toEqual({
      articles: [],
      page: 3,
      hasNextPage: false,
    });
  });

  test("preserves persisted viewer vote state in returned articles", async () => {
    const store: FeedStore = {
      async listRankedArticles() {
        return [{ ...article(1), vote: -1 }];
      },
    };

    const result = await getFeedPage("viewer-1", 1, store);

    expect(result.articles[0]?.vote).toBe(-1);
  });

  test("normalizes invalid numeric input before calculating the offset", async () => {
    const calls: Parameters<FeedStore["listRankedArticles"]>[0][] = [];
    const store: FeedStore = {
      async listRankedArticles(input) {
        calls.push(input);
        return [article(1)];
      },
    };

    const result = await getFeedPage("viewer-1", Number.NaN, store);

    const { skip } = calls[0] ?? {};
    expect(skip).toBe(0);
    expect(result.page).toBe(1);
  });
});
