import { NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingest";

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

  const summary = await runIngestion();
  return NextResponse.json(summary);
}
