# Young Post

A personal engineering-news aggregator: RSS/Atom feeds pulled on a schedule,
ranked per user against an interest profile that learns from thumbs up/down
votes. Google SSO only; built as a portfolio piece.

- Spec: [docs/design-docs/young-post-design.md](docs/design-docs/young-post-design.md)
- Roadmap: milestone plans in [docs/exec-plans/queued](docs/exec-plans/queued)
- Stack: Next.js (App Router) + TypeScript, Prisma 7 + Neon Postgres, Auth.js
  (Google), Tailwind v4, Bun. Harnessed by
  [@samyng/h-alter](https://www.npmjs.com/package/@samyng/h-alter) — see
  `AGENTS.md`.

## Development

```bash
bun install
cp .env.example .env   # fill in values
bun dev
```

`bun run check` runs the full gate (format, lint, typecheck, plan lifecycle).
