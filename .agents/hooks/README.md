# h-alter Agent Hooks

The per-file check runs Biome over changed files via nano-staged — the same
command the git pre-commit hook runs:

```bash
./node_modules/.bin/nano-staged --unstaged --quiet --bail || exit 2
```

Claude Code is wired automatically at `.claude/settings.json` (the `Stop` hook).
The Codex hook schema is not verified here, so wire the same command into Codex's
stop/after-response hook by hand until its schema is confirmed.
