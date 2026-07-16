import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "./auth";

export type AuthenticatedSession = Session & {
  user: NonNullable<Session["user"]> & { id: string };
};

// Per-page session gate for personalised pages and handlers. The bundled
// Next.js auth guide warns against gating in layouts alone (they don't
// re-render on navigation), so every personalised page calls this itself.
export async function requireSession(): Promise<AuthenticatedSession> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }
  return session as AuthenticatedSession;
}
