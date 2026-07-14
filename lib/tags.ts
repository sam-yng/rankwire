export const DEFAULT_TAG_WEIGHTS = {
  "agentic-development": 2,
  "harness-engineering": 2,
  "ai-coding-tools": 0,
  anthropic: 1.5,
  mcp: 1.5,
  "rag-retrieval": 1,
  "local-ai": 1,
  "frontend-development": 0,
  nextjs: 0,
  typescript: 0,
  "postgres-supabase": 0,
  "dev-tooling": 0,
  "testing-quality": 0,
  "trending-repos": 0,
  "new-tech": 0,
} as const;

export type TagName = keyof typeof DEFAULT_TAG_WEIGHTS;

export const TAG_NAMES = Object.keys(DEFAULT_TAG_WEIGHTS) as TagName[];

export function isTagName(value: string): value is TagName {
  return Object.hasOwn(DEFAULT_TAG_WEIGHTS, value);
}
