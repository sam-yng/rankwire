import { Prisma } from "@/app/generated/prisma/client";
import { db } from "./db";
import {
  type RankingStore,
  rankingStoreForTransaction,
  rescoreAllArticlesForUser,
} from "./ranking";

export const VOTE_WEIGHT_DELTA = 0.5;

export type VoteValue = 1 | -1;

export interface CastVoteInput {
  userId: string;
  articleId: string;
  value: VoteValue;
}

export interface CastVoteResult {
  articleId: string;
  value: VoteValue;
  previousValue: VoteValue | null;
  weightAdjustment: number;
}

export interface VoteTransaction extends RankingStore {
  findArticleTags(articleId: string): Promise<string[] | null>;
  findVoteValue(userId: string, articleId: string): Promise<VoteValue | null>;
  upsertVote(input: CastVoteInput): Promise<void>;
  incrementTagWeights(
    userId: string,
    tags: readonly string[],
    adjustment: number,
  ): Promise<void>;
}

export interface VoteStore {
  transaction<T>(operation: (tx: VoteTransaction) => Promise<T>): Promise<T>;
}

export class ArticleNotFoundError extends Error {
  constructor(articleId: string) {
    super(`Article not found: ${articleId}`);
    this.name = "ArticleNotFoundError";
  }
}

export function voteWeightAdjustment(
  previousValue: VoteValue | null,
  value: VoteValue,
): number {
  return (value - (previousValue ?? 0)) * VOTE_WEIGHT_DELTA;
}

export async function castVote(
  input: CastVoteInput,
  store: VoteStore = defaultVoteStore,
): Promise<CastVoteResult> {
  return store.transaction(async (tx) => {
    const tags = await tx.findArticleTags(input.articleId);
    if (!tags) throw new ArticleNotFoundError(input.articleId);

    const previousValue = await tx.findVoteValue(input.userId, input.articleId);
    const weightAdjustment = voteWeightAdjustment(previousValue, input.value);

    await tx.upsertVote(input);
    if (weightAdjustment !== 0 && tags.length > 0) {
      await tx.incrementTagWeights(input.userId, tags, weightAdjustment);
    }
    await rescoreAllArticlesForUser(input.userId, tx);

    return {
      articleId: input.articleId,
      value: input.value,
      previousValue,
      weightAdjustment,
    };
  });
}

const MAX_TRANSACTION_ATTEMPTS = 3;

const defaultVoteStore: VoteStore = {
  async transaction(operation) {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        return await db.$transaction(
          (client) => operation(prismaVoteTransaction(client)),
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5_000,
            timeout: 20_000,
          },
        );
      } catch (error) {
        if (!isTransactionConflict(error) || attempt === MAX_TRANSACTION_ATTEMPTS) {
          throw error;
        }
      }
    }

    throw new Error("Vote transaction retry loop exhausted");
  },
};

function prismaVoteTransaction(client: Prisma.TransactionClient): VoteTransaction {
  return {
    ...rankingStoreForTransaction(client),
    async findArticleTags(articleId) {
      const article = await client.article.findUnique({
        where: { id: articleId },
        select: { tags: true },
      });
      return article?.tags ?? null;
    },
    async findVoteValue(userId, articleId) {
      const vote = await client.vote.findUnique({
        where: { userId_articleId: { userId, articleId } },
        select: { value: true },
      });
      return asVoteValue(vote?.value);
    },
    async upsertVote({ userId, articleId, value }) {
      await client.vote.upsert({
        where: { userId_articleId: { userId, articleId } },
        update: { value },
        create: { userId, articleId, value },
      });
    },
    async incrementTagWeights(userId, tags, adjustment) {
      for (const tag of new Set(tags)) {
        await client.tagWeight.upsert({
          where: { userId_tag: { userId, tag } },
          update: { weight: { increment: adjustment } },
          create: { userId, tag, weight: adjustment },
        });
      }
    },
  };
}

function asVoteValue(value: number | undefined): VoteValue | null {
  return value === 1 || value === -1 ? value : null;
}

function isTransactionConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
  );
}
