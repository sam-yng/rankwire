import { describe, expect, test } from "bun:test";
import Parser from "rss-parser";
import {
  type ArticleStore,
  type NormalizedArticle,
  normalizeItem,
  runIngestion,
} from "./ingest";
import type { Source } from "./sources";

const SOURCE: Source = {
  name: "Test Feed",
  url: "https://example.com/feed",
  tags: ["new-tech", "frontend-development"],
};

// A small Atom fixture: one good entry, one missing its link, one missing its
// title. rss-parser turns both RSS and Atom into the same item shape.
const ATOM_FIXTURE = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Atom</title>
  <entry>
    <title>First Post</title>
    <link href="https://example.com/first"/>
    <updated>2026-07-10T12:00:00Z</updated>
    <summary>A short summary of the first post.</summary>
  </entry>
  <entry>
    <title>No Link Post</title>
    <updated>2026-07-09T09:00:00Z</updated>
    <summary>This entry has no link and must be dropped.</summary>
  </entry>
  <entry>
    <link href="https://example.com/no-title"/>
    <updated>2026-07-08T09:00:00Z</updated>
    <summary>This entry has no title and must be dropped.</summary>
  </entry>
</feed>`;

async function parseFixture(xml: string) {
  const feed = await new Parser().parseString(xml);
  return feed.items;
}

// An in-memory ArticleStore that records every upsert and dedupes by URL, the
// same way the unique-URL constraint does in Postgres.
function fakeStore() {
  const rows = new Map<string, NormalizedArticle>();
  const calls: { url: string; update: Record<string, never> }[] = [];
  const store: ArticleStore = {
    article: {
      async upsert({ where, update, create }) {
        calls.push({ url: where.url, update });
        if (!rows.has(where.url)) rows.set(where.url, create);
        return { id: `article:${where.url}` };
      },
    },
  };
  return { store, rows, calls };
}

function feedOf(items: Parser.Item[]) {
  return { items } as Parser.Output<Record<string, unknown>>;
}

describe("normalizeItem", () => {
  test("normalizes a valid Atom entry with source tags and a parsed date", async () => {
    const [first] = await parseFixture(ATOM_FIXTURE);
    const article = normalizeItem(first, SOURCE);

    expect(article).not.toBeNull();
    expect(article).toMatchObject({
      url: "https://example.com/first",
      title: "First Post",
      summary: "A short summary of the first post.",
      source: "Test Feed",
      tags: ["new-tech", "frontend-development"],
    });
    expect(article?.publishedAt).toBeInstanceOf(Date);
    expect(article?.publishedAt.toISOString()).toBe("2026-07-10T12:00:00.000Z");
  });

  test("drops an item with no link", async () => {
    const items = await parseFixture(ATOM_FIXTURE);
    const noLink = items.find((i) => i.title === "No Link Post");
    expect(noLink).toBeDefined();
    expect(normalizeItem(noLink as Parser.Item, SOURCE)).toBeNull();
  });

  test("drops an item with no title", async () => {
    const items = await parseFixture(ATOM_FIXTURE);
    const noTitle = items.find((i) => i.link === "https://example.com/no-title");
    expect(noTitle).toBeDefined();
    expect(normalizeItem(noTitle as Parser.Item, SOURCE)).toBeNull();
  });

  test("drops an item with a missing or unparseable date", () => {
    expect(
      normalizeItem({ title: "Dated wrong", link: "https://example.com/x" }, SOURCE),
    ).toBeNull();
    expect(
      normalizeItem(
        { title: "Bad date", link: "https://example.com/y", isoDate: "nope" },
        SOURCE,
      ),
    ).toBeNull();
  });

  test("leaves summary null when the feed gives no snippet", () => {
    const article = normalizeItem(
      {
        title: "No summary",
        link: "https://example.com/z",
        isoDate: "2026-07-10T00:00:00Z",
      },
      SOURCE,
    );
    expect(article?.summary).toBeNull();
  });
});

describe("runIngestion", () => {
  test("stores normalized articles and upserts on url with an empty update", async () => {
    const items = await parseFixture(ATOM_FIXTURE);
    const { store, rows, calls } = fakeStore();

    const summary = await runIngestion({
      sources: [SOURCE],
      store,
      rescore: async () => {},
      fetchFeed: async () => feedOf(items),
    });

    expect(summary.ok).toBe(true);
    expect(summary.total).toBe(1); // only the one valid entry
    expect(summary.sources[0]).toMatchObject({ ok: true, count: 1, skipped: 2 });
    expect([...rows.keys()]).toEqual(["https://example.com/first"]);
    expect(calls).toEqual([{ url: "https://example.com/first", update: {} }]);
  });

  test("dedupes repeated URLs within a run", async () => {
    const dupItem = {
      title: "Repeated",
      link: "https://example.com/dup",
      isoDate: "2026-07-10T00:00:00Z",
      contentSnippet: "same url twice",
    };
    const { store, rows, calls } = fakeStore();

    const summary = await runIngestion({
      sources: [SOURCE],
      store,
      rescore: async () => {},
      fetchFeed: async () => feedOf([dupItem, { ...dupItem }]),
    });

    expect(summary.total).toBe(1);
    expect(rows.size).toBe(1);
    expect(calls).toHaveLength(1); // second occurrence never reaches the store
  });

  test("a failing source does not fail the run", async () => {
    const goodSource: Source = { ...SOURCE, name: "Good", url: "https://good/feed" };
    const badSource: Source = { ...SOURCE, name: "Bad", url: "https://bad/feed" };
    const items = await parseFixture(ATOM_FIXTURE);
    const { store, rows } = fakeStore();

    const summary = await runIngestion({
      sources: [goodSource, badSource],
      store,
      rescore: async () => {},
      fetchFeed: async (url) => {
        if (url === badSource.url) throw new Error("boom: feed offline");
        return feedOf(items);
      },
    });

    expect(summary.ok).toBe(false); // a source failed
    expect(summary.total).toBe(1); // but the good source still ingested
    expect(rows.size).toBe(1);

    const bad = summary.sources.find((s) => s.source === "Bad");
    const good = summary.sources.find((s) => s.source === "Good");
    expect(bad).toMatchObject({ ok: false, count: 0, error: "boom: feed offline" });
    expect(good).toMatchObject({ ok: true, count: 1 });
  });

  test("rescoring runs once with unique IDs from successfully ingested articles", async () => {
    const duplicate = {
      title: "Repeated",
      link: "https://example.com/dup",
      isoDate: "2026-07-10T00:00:00Z",
    };
    const { store } = fakeStore();
    const rescored: string[][] = [];

    await runIngestion({
      sources: [SOURCE],
      store,
      rescore: async (articleIds) => {
        rescored.push([...articleIds]);
      },
      fetchFeed: async () => feedOf([duplicate, { ...duplicate }]),
    });

    expect(rescored).toEqual([["article:https://example.com/dup"]]);
  });
});
