import type { FeedArticle } from "@/lib/feed";
import { ArticleCard } from "./article-card";

type FeedListProps = {
  articles: FeedArticle[];
};

export function FeedList({ articles }: FeedListProps) {
  return (
    <ol className="grid grid-cols-1 gap-7 md:grid-cols-2">
      {articles.map((article) => (
        <li key={article.id}>
          <ArticleCard article={article} />
        </li>
      ))}
    </ol>
  );
}
