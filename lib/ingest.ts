import Parser from "rss-parser";
import { z } from "zod";
import { db } from "./db";
import { rescoreArticlesForAllUsers } from "./ranking";
import { SOURCES, type Source } from "./sources";

// A raw feed item as rss-parser hands it to us (RSS and Atom both flow through
// this shape). Kept loose because feeds are untrusted input — Zod does the
// validating in `normalizeItem`.
type RawItem = Parser.Item;
type FeedOutput = Parser.Output<Record<string, unknown>>;

/** Fetches and parses one feed URL into items. Injectable for tests. */
export type FetchFeed = (url: string) => Promise<FeedOutput>;

// The minimal Prisma surface ingestion touches. Typing it structurally lets a
// fake stand in for `db` in tests without a live database.
export interface ArticleStore {
  article: {
    upsert(args: {
      where: { url: string };
      update: Record<string, never>;
      create: NormalizedArticle;
    }): Promise<{ id: string }>;
  };
}

export type RescoreArticles = (articleIds: readonly string[]) => Promise<unknown>;

export interface IngestDeps {
  fetchFeed?: FetchFeed;
  sources?: readonly Source[];
  store?: ArticleStore;
  rescore?: RescoreArticles;
}

export interface SourceResult {
  source: string;
  url: string;
  ok: boolean;
  /** Articles upserted (deduped by URL) when `ok`. */
  count: number;
  /** Feed items dropped by validation when `ok`. */
  skipped: number;
  /** Failure message when `!ok`. */
  error?: string;
}

export interface IngestSummary {
  ok: boolean;
  total: number;
  sources: SourceResult[];
}

// Normalized article shape (design spec §7). `url` is the dedupe key.
export const articleSchema = z.object({
  url: z.url(),
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1).nullable(),
  source: z.string().min(1),
  tags: z.array(z.string()),
  publishedAt: z.date(),
});

export type NormalizedArticle = z.infer<typeof articleSchema>;

const sharedParser = new Parser();

const defaultFetchFeed: FetchFeed = (url) => sharedParser.parseURL(url);

const defaultArticleStore: ArticleStore = {
  article: {
    upsert({ where, update, create }) {
      return db.article.upsert({
        where,
        update,
        create,
        select: { id: true },
      });
    },
  },
};

interface IngestSourceResult extends SourceResult {
  articleIds: string[];
}

/**
 * Normalize one raw feed item against its source into a validated article, or
 * `null` when the item is unusable (no link/title, or a malformed date). Feeds
 * that give only a snippet are correct — we link out via `url`, never republish.
 */
export function normalizeItem(item: RawItem, source: Source): NormalizedArticle | null {
  const rawSummary = item.contentSnippet ?? item.summary ?? item.content ?? null;
  const summary = rawSummary?.trim() ? rawSummary.trim() : null;

  const dateString = item.isoDate ?? item.pubDate;
  const publishedAt = dateString ? new Date(dateString) : null;

  const candidate = {
    url: item.link,
    title: item.title,
    summary,
    source: source.name,
    tags: source.tags,
    // Drop items with no parseable date rather than invent one.
    publishedAt:
      publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
  };

  const parsed = articleSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

async function ingestSource(
  source: Source,
  fetchFeed: FetchFeed,
  store: ArticleStore,
): Promise<IngestSourceResult> {
  const feed = await fetchFeed(source.url);
  const items = feed.items ?? [];

  let count = 0;
  let skipped = 0;
  const articleIds: string[] = [];
  // Dedupe within the run so a feed listing the same URL twice upserts once.
  const seen = new Set<string>();

  for (const item of items) {
    const article = normalizeItem(item, source);
    if (!article) {
      skipped += 1;
      continue;
    }
    if (seen.has(article.url)) continue;
    seen.add(article.url);

    // Upsert on the unique URL with an empty update: existing articles are left
    // untouched (never republished), new ones inserted. This is the cross-run
    // dedupe (design spec §7).
    const stored = await store.article.upsert({
      where: { url: article.url },
      update: {},
      create: article,
    });
    articleIds.push(stored.id);
    count += 1;
  }

  return {
    source: source.name,
    url: source.url,
    ok: true,
    count,
    skipped,
    articleIds,
  };
}

/**
 * Pull every source concurrently, normalize + dedupe + store each. Uses
 * `Promise.allSettled` so one dead feed never kills the run (design spec §7):
 * a failing source is reported with `ok: false` and its error message.
 */
export async function runIngestion(deps: IngestDeps = {}): Promise<IngestSummary> {
  const fetchFeed = deps.fetchFeed ?? defaultFetchFeed;
  const sources = deps.sources ?? SOURCES;
  const store = deps.store ?? defaultArticleStore;
  const rescore = deps.rescore ?? rescoreArticlesForAllUsers;

  const settled = await Promise.allSettled(
    sources.map((source) => ingestSource(source, fetchFeed, store)),
  );

  const articleIds = new Set<string>();
  const results: SourceResult[] = settled.map((outcome, index) => {
    if (outcome.status === "fulfilled") {
      for (const articleId of outcome.value.articleIds) articleIds.add(articleId);
      const { articleIds: _, ...result } = outcome.value;
      return result;
    }
    const source = sources[index];
    return {
      source: source.name,
      url: source.url,
      ok: false,
      count: 0,
      skipped: 0,
      error:
        outcome.reason instanceof Error
          ? outcome.reason.message
          : String(outcome.reason),
    };
  });

  await rescore([...articleIds]);

  const total = results.reduce((sum, result) => sum + result.count, 0);
  return { ok: results.every((result) => result.ok), total, sources: results };
}
