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

- **Structural correctness** (API responses, D1 state, composable state transitions) belongs in vitest and runs as part of verification.
- **Visual/subjective judgment** (layout, spacing, animation, cross-browser rendering) stays a human check against the running app. Don't try to automate it away.
- **Persist a regression test only for a durable flow worth protecting**, ideally one with evidence it has broken before (see git history). A one-off check that verified a single change doesn't need to become a permanent file. When unsure, ask the user.

## Subagents

Project agents live in `.claude/agents/` and sit alongside Claude Code's built-in agents:

- `researcher` — external docs only (zod, drizzle, Hono, Cloudflare Workers/Vite/vitest plugins, Vue). Local code search is the built-in `Explore` agent's job.
- `reviewer` — reviews the uncommitted diff against this file and `.claude/rules/`. Read-only.
- `tester` — runs `pnpm test` and `pnpm check`; may add tests, never edits implementation code.

Risk areas (subtle bugs are costly here): `src/server/middleware/auth.ts`, `src/server/index.ts` (rate limiting, `onError`, security headers, admin concealment), `src/server/lib/batch.ts`, `migrations/` + `src/server/db/schema.ts`, and the race-guarded composables in `src/client/composables/`.

Tiers:

1. **Trivial** (one-line fix, typo, config tweak): implement directly, no agents.
2. **Non-trivial but contained** (self-contained change in one area): implement directly. Optionally run `Explore` first to confirm a convention, or `researcher` for an unfamiliar external API. Afterward, run `reviewer` and `tester` in parallel **without asking** — both are read-only/test-only, so they're cheap and exist to catch the blind spot of reviewing your own work.
3. **Large, ambiguous, or high-risk** (spans many files, substantially touches a risk area, or the task itself is ambiguous): propose that the user drive it with `/goal`, and hand them a ready-to-use condition that names the checks, e.g. "implement X; done when reviewer reports no findings and tester passes". The evaluator only reads the condition text, so a condition without the agents ends the loop right after implementation. Each turn: `Explore` + `researcher` in parallel, implement here, then `reviewer` + `tester` in parallel, repeating until the condition holds. Always propose this rather than assuming it — it's a real commitment of time and tokens.

Visual verification is a separate axis from the tiers — it depends on whether the change touches rendered UI, not on how risky it is:

- **No rendered surface touched**: skip.
- **Small, isolated, single-property tweak**: a quick manual glance at `pnpm dev` is enough.
- **Viewport-dependent layout, shared styles across components, or a reported visual bug**: check the running app across a range of widths and in both Chromium and Firefox (past bugs were Firefox-only). There is no browser-automation agent yet; propose adding one (Playwright-based) if this becomes frequent.

The main conversation writes the code at every tier; there is no implementer agent. Implementation shares context across planning, coding, and iterating on review/test findings, which a subagent would lose on every re-spawn (each starts fresh), and its real output is the working tree, not a summary. The value of `reviewer` and `tester` — an opinion from something that didn't write the code — holds either way.

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
