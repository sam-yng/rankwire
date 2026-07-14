import Link from "next/link";
import { getFeedPage, parseFeedPage } from "@/lib/feed";
import { requireSession } from "@/lib/session";
import { FeedList } from "./components/feed-list";
import { EndMark, Masthead } from "./components/ui";

type HomeProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

const mastheadDate = new Intl.DateTimeFormat("en-AU", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Australia/Sydney",
});

export default async function Home({ searchParams }: HomeProps) {
  const session = await requireSession();
  const page = parseFeedPage((await searchParams).page);
  const feed = await getFeedPage(session.user.id, page);

  return (
    <main className="flex-1 py-7 sm:py-10">
      <Masthead
        date={mastheadDate.format(new Date())}
        tagline="Personal engineering dispatch"
        edition={`Page ${String(feed.page).padStart(2, "0")}`}
        title="Rankwire"
        controls={
          <>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg">
              Ranked for you
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-meta">
              30 stories per page
            </span>
          </>
        }
      />

      <div className="mx-auto w-full max-w-[1080px] px-6 pt-8">
        {feed.articles.length > 0 ? (
          <FeedList articles={feed.articles} />
        ) : (
          <EndMark title={feed.page === 1 ? "Nothing on the wire" : "Page is empty"}>
            {feed.page === 1
              ? "No ranked articles yet. Run ingestion, then check back here."
              : "Return to an earlier page to continue reading."}
          </EndMark>
        )}

        <Pagination page={feed.page} hasNextPage={feed.hasNextPage} />
      </div>
    </main>
  );
}

function Pagination({ page, hasNextPage }: { page: number; hasNextPage: boolean }) {
  if (page === 1 && !hasNextPage) return null;

  const linkClasses =
    "rounded-btn border border-fg bg-page px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-fg shadow-sticker transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none";

  return (
    <nav
      aria-label="Feed pages"
      className="mt-10 flex items-center justify-between border-t border-rule pt-6"
    >
      {page > 1 ? (
        <Link href={page === 2 ? "/" : `/?page=${page - 1}`} className={linkClasses}>
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-meta">
        Page {page}
      </span>
      {hasNextPage ? (
        <Link href={`/?page=${page + 1}`} className={linkClasses}>
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
