import { db } from "./db";

export const FEED_PAGE_SIZE = 30;

export interface FeedArticle {
  id: string;
  url: string;
  title: string;
  summary: string | null;
  source: string;
  tags: string[];
  publishedAt: Date;
  score: number;
}

export interface FeedPage {
  articles: FeedArticle[];
  page: number;
  hasNextPage: boolean;
}

export interface FeedStore {
  listRankedArticles(input: {
    userId: string;
    skip: number;
    take: number;
  }): Promise<FeedArticle[]>;
}

const defaultFeedStore: FeedStore = {
  async listRankedArticles({ userId, skip, take }) {
    const rows = await db.articleScore.findMany({
      where: { userId },
      orderBy: [
        { score: "desc" },
        { article: { publishedAt: "desc" } },
        { articleId: "asc" },
      ],
      skip,
      take,
      select: {
        score: true,
        article: {
          select: {
            id: true,
            url: true,
            title: true,
            summary: true,
            source: true,
            tags: true,
            publishedAt: true,
          },
        },
      },
    });

    return rows.map(({ article, score }) => ({ ...article, score }));
  },
};

export function parseFeedPage(value: string | string[] | undefined): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return 1;
  return normalizePage(Number(value));
}

export async function getFeedPage(
  userId: string,
  requestedPage: number,
  store: FeedStore = defaultFeedStore,
): Promise<FeedPage> {
  const page = normalizePage(requestedPage);
  const rows = await store.listRankedArticles({
    userId,
    skip: (page - 1) * FEED_PAGE_SIZE,
    take: FEED_PAGE_SIZE + 1,
  });

  return {
    articles: rows.slice(0, FEED_PAGE_SIZE),
    page,
    hasNextPage: rows.length > FEED_PAGE_SIZE,
  };
}

function normalizePage(page: number): number {
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}
