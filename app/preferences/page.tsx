import { getPreferences } from "@/lib/preferences";
import { requireSession } from "@/lib/session";
import { Masthead } from "../components/ui";
import { PreferencesForm } from "./preferences-form";

export const dynamic = "force-dynamic";

const pageDate = new Intl.DateTimeFormat("en-AU", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Australia/Sydney",
});

export default async function PreferencesPage() {
  const session = await requireSession();
  const preferences = await getPreferences(session.user.id);

  return (
    <main className="flex-1 py-7 sm:py-10">
      <Masthead
        date={pageDate.format(new Date())}
        tagline="Tune your personal dispatch"
        edition="15 signal weights"
        title="Preferences"
        controls={
          <>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg">
              Higher weight raises matching stories
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-meta">
              Save to rescore your feed
            </span>
          </>
        }
      />

      <section className="mx-auto w-full max-w-[1080px] px-6">
        <PreferencesForm preferences={preferences} />
      </section>
    </main>
  );
}
