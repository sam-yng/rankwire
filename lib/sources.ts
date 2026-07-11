// Feed sources for ingestion (design spec §7). Tags are assigned per source and
// become the article's tags at normalization time — feed categories are ignored.
// Expand deliberately only once ranking has vote signal to work with.

export interface Source {
  /** Display name stored on each article's `source` field. */
  name: string;
  /** RSS or Atom feed URL. */
  url: string;
  /** Taxonomy tags (design spec §9) applied to every item from this feed. */
  tags: string[];
}

export const SOURCES: readonly Source[] = [
  { name: "Julia Evans", url: "https://jvns.ca/atom.xml", tags: ["new-tech"] },
  {
    name: "Simon Willison",
    url: "https://simonwillison.net/atom/everything/",
    tags: ["ai-coding-tools", "new-tech"],
  },
  {
    name: "Martin Fowler",
    url: "https://martinfowler.com/feed.atom",
    tags: ["new-tech"],
  },
  {
    name: "GitHub Blog",
    url: "https://github.blog/feed/",
    tags: ["ai-coding-tools", "trending-repos"],
  },
  {
    name: "Netflix Tech Blog",
    url: "https://netflixtechblog.com/feed",
    tags: ["new-tech"],
  },
  {
    name: "CSS-Tricks",
    url: "https://css-tricks.com/feed/",
    tags: ["frontend-development"],
  },
  {
    name: "Smashing Magazine",
    url: "https://www.smashingmagazine.com/feed/",
    tags: ["frontend-development"],
  },
  {
    name: "dev.to webdev",
    url: "https://dev.to/feed/tag/webdev",
    tags: ["frontend-development"],
  },
  {
    name: "Evil Martians",
    url: "https://evilmartians.com/chronicles.atom",
    tags: ["frontend-development"],
  },
  {
    name: "Hacker News 150+",
    url: "https://hnrss.org/frontpage?points=150",
    tags: ["new-tech", "trending-repos"],
  },
  { name: "Lobsters", url: "https://lobste.rs/rss", tags: ["new-tech"] },
  {
    name: "Stack Overflow Blog",
    url: "https://stackoverflow.blog/feed/",
    tags: ["new-tech", "dev-tooling"],
  },
];

// Add-when-available (design spec §7): Anthropic exposes no official RSS/Atom
// feed as of 2026-07-02, and only the official feed is acceptable (no community
// scrapers). Re-check occasionally; when an official feed ships, add it here
// with tags ["anthropic", "ai-coding-tools"]. Until then Simon Willison's feed
// covers most Claude/Anthropic/MCP news.
