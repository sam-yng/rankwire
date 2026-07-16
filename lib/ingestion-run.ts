import { db } from "./db";

const ACTIVE_RUN_WINDOW_MS = 30 * 60 * 1000;

export async function startIngestionRun(): Promise<{ id: string }> {
  return db.ingestionRun.create({ data: { status: "running" } });
}

export async function completeIngestionRun(id: string, total: number): Promise<void> {
  await db.ingestionRun.update({
    where: { id },
    data: { status: "complete", completedAt: new Date(), total },
  });
}

export async function failIngestionRun(id: string): Promise<void> {
  await db.ingestionRun.update({
    where: { id },
    data: { status: "failed", completedAt: new Date() },
  });
}

/** Ignore abandoned serverless invocations so one crashed job never blocks UI. */
export async function isIngestionRunning(now = new Date()): Promise<boolean> {
  const run = await db.ingestionRun.findFirst({
    where: {
      status: "running",
      startedAt: { gte: new Date(now.getTime() - ACTIVE_RUN_WINDOW_MS) },
    },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });

  return run !== null;
}
