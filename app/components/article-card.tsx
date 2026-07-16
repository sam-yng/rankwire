import type { CSSProperties } from "react";
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
  headingLevel?: 2 | 3;
};

export function ArticleCard({ article, headingLevel = 2 }: ArticleCardProps) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const sourceStyle = getSourceStyle(article.source);

  return (
    <article
      className="article-card relative flex h-full flex-col overflow-hidden rounded-card border border-fg bg-surface p-5 shadow-card transition-[transform,box-shadow] duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-card-kept sm:p-6"
      style={{ "--article-accent": sourceStyle.color } as CSSProperties}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.12em] text-meta">
        <span className="flex items-center gap-2 text-fg">
          <span
            aria-hidden="true"
            className="grid size-5 place-items-center rounded-[2px] font-mono text-[8px] font-bold tracking-normal text-white"
            style={{ backgroundColor: sourceStyle.color }}
          >
            {sourceStyle.mark}
          </span>
          {article.source}
        </span>
        <time dateTime={article.publishedAt.toISOString()}>
          {publishedDate.format(article.publishedAt)}
        </time>
      </div>

      <Heading className="mt-5 font-serif text-[24px] leading-[1.12] tracking-[-0.015em] text-fg">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="decoration-1 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg"
        >
          {article.title}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </Heading>

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

const SOURCE_STYLES: Record<string, { color: string; mark: string }> = {
  "Julia Evans": { color: "#5d4db4", mark: "JE" },
  "Simon Willison": { color: "#007a78", mark: "SW" },
  "Martin Fowler": { color: "#a83f61", mark: "MF" },
  "GitHub Blog": { color: "#24292f", mark: "GH" },
  "Netflix Tech Blog": { color: "#b20710", mark: "N" },
  "CSS-Tricks": { color: "#d06617", mark: "CS" },
  "Smashing Magazine": { color: "#cf3232", mark: "SM" },
  "dev.to webdev": { color: "#3c3c3c", mark: "DEV" },
  "Evil Martians": { color: "#e4473c", mark: "EM" },
  "Hacker News 150+": { color: "#e35d00", mark: "HN" },
  Lobsters: { color: "#af3e32", mark: "LO" },
  "Stack Overflow Blog": { color: "#e7700d", mark: "SO" },
};

function getSourceStyle(source: string): { color: string; mark: string } {
  return (
    SOURCE_STYLES[source] ?? {
      color: "#55524d",
      mark: source.slice(0, 2).toUpperCase(),
    }
  );
}

function formatScore(score: number): string {
  return new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(score);
}
