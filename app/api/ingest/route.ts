import { NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingest";
import {
  completeIngestionRun,
  failIngestionRun,
  startIngestionRun,
} from "@/lib/ingestion-run";

// Cron-callable ingestion trigger (design spec §4, §11). Machine caller only:
// the GitHub Actions workflow POSTs here with the shared CRON_SECRET header.
// Ingestion hits the network and the database, so keep it dynamic.
export const dynamic = "force-dynamic";

const CRON_HEADER = "x-cron-secret";

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get(CRON_HEADER);

  // Fail closed: a missing/empty configured secret rejects every caller rather
  // than silently allowing an unauthenticated trigger.
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const run = await startIngestionRun();

  try {
    const summary = await runIngestion();
    await completeIngestionRun(run.id, summary.total);
    return NextResponse.json(summary);
  } catch (error) {
    await failIngestionRun(run.id);
    console.error("Ingestion failed", error);
    return NextResponse.json({ error: "Ingestion failed" }, { status: 500 });
  }
}
