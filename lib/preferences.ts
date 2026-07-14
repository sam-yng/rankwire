import { Prisma } from "@/app/generated/prisma/client";
import { db } from "./db";
import {
  type RankingStore,
  rankingStoreForTransaction,
  rescoreAllArticlesForUser,
} from "./ranking";
import { DEFAULT_TAG_WEIGHTS, isTagName, TAG_NAMES, type TagName } from "./tags";

export interface PreferenceValue {
  tag: TagName;
  weight: number;
}

export interface RawPreferenceValue {
  tag: unknown;
  weight: unknown;
}

export interface PreferencesTransaction extends RankingStore {
  upsertTagWeights(userId: string, values: readonly PreferenceValue[]): Promise<void>;
}

export interface PreferencesStore {
  listTagWeights(userId: string): Promise<{ tag: string; weight: number }[]>;
  transaction<T>(operation: (tx: PreferencesTransaction) => Promise<T>): Promise<T>;
}

export class InvalidPreferencesError extends Error {
  constructor() {
    super("Preferences must contain every known tag exactly once with finite weights");
    this.name = "InvalidPreferencesError";
  }
}

export async function getPreferences(
  userId: string,
  store: PreferencesStore = defaultPreferencesStore,
): Promise<PreferenceValue[]> {
  const rows = await store.listTagWeights(userId);
  const stored = new Map(
    rows
      .filter((row) => isTagName(row.tag) && Number.isFinite(row.weight))
      .map((row) => [row.tag, row.weight]),
  );

  return TAG_NAMES.map((tag) => ({
    tag,
    weight: stored.get(tag) ?? DEFAULT_TAG_WEIGHTS[tag],
  }));
}

export function validatePreferenceValues(
  input: readonly RawPreferenceValue[],
): PreferenceValue[] {
  if (input.length !== TAG_NAMES.length) throw new InvalidPreferencesError();

  const values = new Map<TagName, number>();
  for (const item of input) {
    if (
      typeof item.tag !== "string" ||
      !isTagName(item.tag) ||
      typeof item.weight !== "number" ||
      !Number.isFinite(item.weight) ||
      values.has(item.tag)
    ) {
      throw new InvalidPreferencesError();
    }
    values.set(item.tag, item.weight);
  }

  if (values.size !== TAG_NAMES.length) throw new InvalidPreferencesError();
  return TAG_NAMES.map((tag) => ({ tag, weight: values.get(tag) as number }));
}

export async function savePreferences(
  userId: string,
  input: readonly RawPreferenceValue[],
  store: PreferencesStore = defaultPreferencesStore,
): Promise<PreferenceValue[]> {
  const values = validatePreferenceValues(input);

  await store.transaction(async (tx) => {
    await tx.upsertTagWeights(userId, values);
    await rescoreAllArticlesForUser(userId, tx);
  });

  return values;
}

const MAX_TRANSACTION_ATTEMPTS = 3;

const defaultPreferencesStore: PreferencesStore = {
  listTagWeights(userId) {
    return db.tagWeight.findMany({
      where: { userId },
      select: { tag: true, weight: true },
    });
  },
  async transaction(operation) {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        return await db.$transaction(
          (client) =>
            operation({
              ...rankingStoreForTransaction(client),
              async upsertTagWeights(userId, values) {
                for (const { tag, weight } of values) {
                  await client.tagWeight.upsert({
                    where: { userId_tag: { userId, tag } },
                    update: { weight },
                    create: { userId, tag, weight },
                  });
                }
              },
            }),
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

    throw new Error("Preferences transaction retry loop exhausted");
  },
};

function isTransactionConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
  );
}
