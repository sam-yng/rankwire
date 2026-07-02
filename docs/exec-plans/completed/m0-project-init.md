# M0 — Project initialisation (completed 2026-07-02)

Goal: turn the Create-Next-App scaffold into a harnessed, dependency-ready
starting point for the Young Post build.

Done:

- Git remote `origin` set to `git@github.com:sam-yng/young-post.git`; work on
  the `project-init` branch off `main`.
- Installed `@prisma/client`, `zod` (deps) and `prisma`, `dotenv`,
  `@samyng/h-alter` (dev deps); ran `bunx prisma init` (Prisma 7:
  `prisma.config.ts`, `prisma/schema.prisma` with `prisma-client` generator →
  `app/generated/prisma`, gitignored).
- Applied the h-alter Standard harness (`h-alter install . --yes`): AGENTS.md,
  docs tree, gate scripts, lefthook pre-commit (nano-staged + Biome), Claude
  skill mirror + Stop hook, CI gate at `.github/workflows/check.yml`.
  Conflicts resolved by adopting h-alter's package scripts and biome.json,
  then re-adding Next-specific Biome settings (`.next` ignore, react/next
  domains, `tailwindDirectives`); the Next.js-version warning moved from
  AGENTS.md to CLAUDE.md.
- Replaced scaffold page/SVGs so the lint gate passes; `bun run check` green.
- Wrote the updated design brief (`docs/design-docs/young-post-design.md`)
  resolving all open decisions: Neon, GitHub Actions, precompute ranking,
  official-Anthropic-feed-only (none exists yet — add when available), 2-day
  in-app digest, email removed, Google SSO added.
