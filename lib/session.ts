import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "./auth";

// Per-page session gate for personalised pages and handlers. The bundled
// Next.js auth guide warns against gating in layouts alone (they don't
// re-render on navigation), so every personalised page calls this itself.
export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }
  return session;
}
