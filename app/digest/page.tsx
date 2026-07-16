import { FeedList } from "@/app/components/feed-list";
import { EndMark, Masthead } from "@/app/components/ui";
import {
  DIGEST_ARTICLES_PER_WINDOW,
  formatDigestWindow,
  getDigest,
} from "@/lib/digest";
import { requireSession } from "@/lib/session";

const mastheadDate = new Intl.DateTimeFormat("en-AU", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Australia/Sydney",
});

export default async function DigestPage() {
  const session = await requireSession();
  const windows = await getDigest(session.user.id);

  return (
    <main className="page-enter flex-1 py-7 sm:py-10">
      <Masthead
        date={mastheadDate.format(new Date())}
        tagline="Your two-day engineering dispatch"
        edition={`${windows.length} ${windows.length === 1 ? "edition" : "editions"}`}
        title="Digest"
        controls={
          <>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg">
              Ranked for you
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-meta">
              Top {DIGEST_ARTICLES_PER_WINDOW} stories · 48-hour UTC editions
            </span>
          </>
        }
      />

      <div className="mx-auto w-full max-w-[1080px] px-6 pt-8">
        {windows.length > 0 ? (
          <div className="space-y-14">
            {windows.map((window) => {
              const label = formatDigestWindow(window);
              const headingId = `digest-${window.startsAt.toISOString().slice(0, 10)}`;

              return (
                <section
                  key={window.startsAt.toISOString()}
                  aria-labelledby={headingId}
                >
                  <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-fg pb-3">
                    <h2
                      id={headingId}
                      className="font-serif text-[27px] leading-tight tracking-[-0.01em] text-fg"
                    >
                      {label}
                    </h2>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-meta">
                      {window.articles.length}{" "}
                      {window.articles.length === 1 ? "story" : "stories"}
                    </span>
                  </div>
                  <FeedList articles={window.articles} articleHeadingLevel={3} />
                </section>
              );
            })}
          </div>
        ) : (
          <EndMark title="Nothing in the digest">
            No ranked articles yet. Run ingestion, then check back here.
          </EndMark>
        )}
      </div>
    </main>
  );
}
