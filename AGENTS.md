# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Approach

- **Change scope.** Change only what was requested. Don't "improve" adjacent code, comments, or formatting; match the existing style. Delete code your own change makes unused, never leave it commented out. Point out pre-existing dead code only; don't delete, split, or refactor it unless asked.
- **Implementation size.** Don't add unrequested features, abstractions, or configurability. Extract a helper only when it's used in 3+ places; otherwise inline it. Don't write error handling for cases that can't happen.
- **Uncertainty.** When more than one interpretation is possible, present the options instead of silently picking one.

## Language

Default to the user's language for everything interactive — chat replies, plan-mode proposals, clarifying questions, and any other back-and-forth during the session.

Switch to English only for durable artifacts: things other people or tools will read after the session ends — in-code comments, console/log/error output, AI-readable instruction files, and reader-facing docs (README and the like). Scratch notes and other throwaway dev artifacts stay in the user's language.

## Production safety — NEVER touch production from local

**All production changes must go through GitHub Actions. Never run any command that writes to or deploys production from a local environment.**

This is a hard rule with no exceptions, including "emergencies":

- ❌ `wrangler deploy` — forbidden locally; deploys go through CI/CD only
- ❌ `wrangler d1 migrations apply --remote` — forbidden; CI/CD applies remote migrations
- ❌ Any script or command targeting a production URL or remote D1

If asked to run any such command, refuse and explain this policy.

**Permitted local operations:** `pnpm dev`, `pnpm build` (local build only), `pnpm db:migrate` (local D1 only), `pnpm seed:local` (localhost only), and all read-only wrangler commands with `--local`.

## Code Structure

- Name variables, functions, and files to communicate intent.
- One concern per file; split when a file exceeds ~300 lines.

## Testing

- Write tests before or alongside implementation — they are your success criteria.
- Test observable outcomes and edge cases, not implementation details.
- Each test is fully self-contained; no shared mutable state between tests.

Test environment details and helpers are in `.claude/rules/testing.md`.

## Commits

Format — plain prose, no prefixes or labels (`feat:`, `fix:`, and the like):

```
<summary: imperative mood, ≤70 chars, no trailing period>

<motivation: one sentence, only when not evident from the diff>

- <change bullets: only for 2+ distinct changes>
```

- Never commit secrets (`*.key`, `*.pem`, `credentials*`).
- Never use `--no-verify`. Use `--amend` only when explicitly asked; default to a new commit.

## Conventions

Coding conventions are in `.claude/rules/` (path-scoped, auto-loaded when editing matching files):

- `migrations.md` — D1/SQLite schema patterns (`migrations/**`)
- `server.md` — Hono route and D1 query conventions (`src/server/**`)
- `vue.md` — Vue 3 component conventions (`src/client/**/*.vue`)
- `composables.md` — Composable conventions: singleton pattern, race guard, mutation→re-fetch (`src/client/composables/*.ts`)
- `testing.md` — Test structure, patterns, and what to test/skip (`**/*.test.ts`)

Step-by-step recipes for common changes (add a column, add an endpoint, deploy, etc.) are in `docs/update-playbook.md`.

## Keeping rules up to date

After any code change, check whether `.claude/rules/` needs updating:

- Modified server code → review `rules/server.md`
- Modified Vue components → review `rules/vue.md`
- Modified composables → review `rules/composables.md`
- Modified migrations → review `rules/migrations.md`

Update the relevant files immediately when conventions change or new patterns emerge. Do not defer.

## Architecture

This is a **Cloudflare Workers + D1 + Hono** backend serving a **Vue 3** MPA (two pages: viewer and admin). API routes live in `src/server/routes/`, shared types/schemas in `src/shared/`, and the two client apps (viewer + admin) in `src/client/`.

Full reference — request flow, module-by-module breakdown, DB schema, Vite config quirks, data import/export, and deployment/first-time setup — is in `docs/architecture.md`.
