import type { CSSProperties } from "react";
import type { FeedArticle } from "@/lib/feed";
import { ArticleCard } from "./article-card";

type FeedListProps = {
  articles: FeedArticle[];
  articleHeadingLevel?: 2 | 3;
};

export function FeedList({ articles, articleHeadingLevel = 2 }: FeedListProps) {
  return (
    <ol className="grid grid-cols-1 gap-7 md:grid-cols-2">
      {articles.map((article, index) => (
        <li
          key={article.id}
          className="article-reveal"
          style={{ "--card-delay": `${Math.min(index * 45, 360)}ms` } as CSSProperties}
        >
          <ArticleCard article={article} headingLevel={articleHeadingLevel} />
        </li>
      ))}
    </ol>
  );
}
