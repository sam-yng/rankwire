import type { FeedArticle } from "@/lib/feed";
import { Badge } from "./ui";
import { VoteButtons } from "./vote-buttons";

const publishedDate = new Intl.DateTimeFormat("en-AU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

type ArticleCardProps = {
  article: FeedArticle;
};

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="flex h-full flex-col rounded-card border border-fg bg-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.12em] text-meta">
        <span>{article.source}</span>
        <time dateTime={article.publishedAt.toISOString()}>
          {publishedDate.format(article.publishedAt)}
        </time>
      </div>

      <h2 className="mt-5 font-serif text-[24px] leading-[1.12] tracking-[-0.015em] text-fg">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="decoration-1 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg"
        >
          {article.title}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </h2>

      {article.summary ? (
        <p className="mt-4 line-clamp-3 font-sans text-[14.5px] leading-[1.6] text-meta">
          {article.summary}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {article.tags.map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mt-auto flex min-h-9 items-end justify-between border-t border-rule pt-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-meta">
          Score {formatScore(article.score)}
        </span>
        <VoteButtons articleId={article.id} initialVote={article.vote} />
      </div>
    </article>
  );
}

function formatScore(score: number): string {
  return new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(score);
}
