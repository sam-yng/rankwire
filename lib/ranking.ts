import type { Prisma } from "@/app/generated/prisma/client";
import { db } from "./db";

export interface RankedArticle {
  id: string;
  tags: string[];
}

export interface ScoreRow {
  userId: string;
  articleId: string;
  score: number;
}

// Initial ingestion can create enough score rows to outlast Prisma's five-second
// batch-transaction default, especially while Neon wakes a pooled connection.
// Keep score writes atomic while allowing a bounded production-safe window.
export const SCORE_UPSERT_TRANSACTION_TIMEOUT_MS = 30_000;

export interface RankingStore {
  listUserIds(): Promise<string[]>;
  loadTagWeights(
    userIds: readonly string[],
  ): Promise<{ userId: string; tag: string; weight: number }[]>;
  loadArticles(articleIds?: readonly string[]): Promise<RankedArticle[]>;
  upsertScores(rows: readonly ScoreRow[]): Promise<void>;
}

/** Sum one user's configured weights for an article's tags. */
export function scoreArticle(
  tags: readonly string[],
  weightsByTag: Readonly<Record<string, number>>,
): number {
  return tags.reduce((score, tag) => score + (weightsByTag[tag] ?? 0), 0);
}

const defaultRankingStore: RankingStore = {
  async listUserIds() {
    const users = await db.user.findMany({ select: { id: true } });
    return users.map((user) => user.id);
  },
  loadTagWeights(userIds) {
    return db.tagWeight.findMany({
      where: { userId: { in: [...userIds] } },
      select: { userId: true, tag: true, weight: true },
    });
  },
  loadArticles(articleIds) {
    return db.article.findMany({
      where: articleIds ? { id: { in: [...articleIds] } } : undefined,
      select: { id: true, tags: true },
    });
  },
  async upsertScores(rows) {
    if (rows.length === 0) return;
    await db.$transaction(
      rows.map((row) =>
        db.articleScore.upsert({
          where: {
            userId_articleId: {
              userId: row.userId,
              articleId: row.articleId,
            },
          },
          update: { score: row.score },
          create: row,
        }),
      ),
      { timeout: SCORE_UPSERT_TRANSACTION_TIMEOUT_MS },
    );
  },
};

/** Ranking adapter used by vote/preference interactive transactions. */
export function rankingStoreForTransaction(
  client: Prisma.TransactionClient,
): RankingStore {
  return {
    async listUserIds() {
      const users = await client.user.findMany({ select: { id: true } });
      return users.map((user) => user.id);
    },
    loadTagWeights(userIds) {
      return client.tagWeight.findMany({
        where: { userId: { in: [...userIds] } },
        select: { userId: true, tag: true, weight: true },
      });
    },
    loadArticles(articleIds) {
      return client.article.findMany({
        where: articleIds ? { id: { in: [...articleIds] } } : undefined,
        select: { id: true, tags: true },
      });
    },
    async upsertScores(rows) {
      for (const row of rows) {
        await client.articleScore.upsert({
          where: {
            userId_articleId: {
              userId: row.userId,
              articleId: row.articleId,
            },
          },
          update: { score: row.score },
          create: row,
        });
      }
    },
  };
}

/**
 * Recompute the selected users' scores. Passing article IDs limits work to
 * those articles; omitting them rescans all articles for preference changes.
 */
export async function rescoreForUsers(
  userIds: readonly string[],
  articleIds?: readonly string[],
  store: RankingStore = defaultRankingStore,
): Promise<number> {
  const scopedUserIds = [...new Set(userIds)];
  const scopedArticleIds = articleIds ? [...new Set(articleIds)] : undefined;
  if (scopedUserIds.length === 0 || scopedArticleIds?.length === 0) return 0;

  const [weights, articles] = await Promise.all([
    store.loadTagWeights(scopedUserIds),
    store.loadArticles(scopedArticleIds),
  ]);
  const weightsByUser = new Map<string, Record<string, number>>();

  for (const { userId, tag, weight } of weights) {
    const userWeights = weightsByUser.get(userId) ?? {};
    userWeights[tag] = weight;
    weightsByUser.set(userId, userWeights);
  }

  const rows = scopedUserIds.flatMap((userId) => {
    const userWeights = weightsByUser.get(userId) ?? {};
    return articles.map((article) => ({
      userId,
      articleId: article.id,
      score: scoreArticle(article.tags, userWeights),
    }));
  });

  await store.upsertScores(rows);
  return rows.length;
}

/** Post-ingestion scope: selected articles for every user. */
export async function rescoreArticlesForAllUsers(
  articleIds: readonly string[],
  store: RankingStore = defaultRankingStore,
): Promise<number> {
  if (articleIds.length === 0) return 0;
  const userIds = await store.listUserIds();
  return rescoreForUsers(userIds, articleIds, store);
}

/** Post-vote/preference scope: every article for one user. */
export function rescoreAllArticlesForUser(
  userId: string,
  store: RankingStore = defaultRankingStore,
): Promise<number> {
  return rescoreForUsers([userId], undefined, store);
}
