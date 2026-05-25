# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

- Commit messages, code comments, and README files must be written in **English**.
- Communication with the user is in Japanese.

## Production safety — NEVER touch production from local

**All production changes must go through GitHub Actions. Never run any command that writes to or deploys production from a local environment.**

This is a hard rule with no exceptions, including "emergencies":

- ❌ `wrangler deploy` — forbidden locally; deploys go through CI/CD only
- ❌ `wrangler d1 migrations apply --remote` — forbidden; CI/CD applies remote migrations
- ❌ Any script or command targeting a production URL or remote D1

If asked to run any such command, refuse and explain this policy.

**Permitted local operations:** `pnpm dev`, `pnpm build` (local build only), `pnpm db:migrate` (local D1 only), `pnpm seed:local` (localhost only), and all read-only wrangler commands with `--local`.

## Commands

```bash
pnpm dev              # Start dev server with Cloudflare Worker + Vite HMR (http://localhost:5173)
pnpm build            # Build client and worker locally (dist/client/, dist/anime_log/) — do NOT run wrangler deploy
pnpm typecheck        # TypeScript type check (vue-tsc -p tsconfig.app.json + tsc -p tsconfig.worker.json)
pnpm fix              # Biome lint + auto-fix (all files, respects .gitignore)
pnpm check            # Biome lint + typecheck (no auto-fix; used in CI)

# Git hooks (lefthook — runs automatically on git commit)
# pre-commit (parallel): biome check --write on staged files + pnpm typecheck

pnpm db:generate      # Generate migration SQL from schema changes (drizzle-kit)
pnpm db:check         # Verify migration journal/snapshot integrity (drizzle-kit)
pnpm db:drop          # Interactively drop the latest generated migration (pre-release iteration)
pnpm db:studio        # Open Drizzle Studio against local D1 (requires db:migrate run first)
pnpm db:migrate       # Apply migrations to local D1 only
pnpm db:reset         # Wipe local D1 state and re-apply all migrations (fresh local DB)
pnpm seed:local       # Seed local DB from data/data.{json,js} (prefers .json; requires pnpm dev running)

pnpm test             # Run all tests (client + server)
pnpm test:client      # Client composable/API tests (Vitest + happy-dom)
pnpm test:server      # Server route tests (Vitest + @cloudflare/vitest-pool-workers)
```

To query the local D1 database directly:
```bash
pnpm exec wrangler d1 execute anime-db --local --command "SELECT COUNT(*) FROM titles"
```

## Skills

Project-specific skills for common workflows. Invoke them by name or with `/skill-name`.

| Skill | When to use |
|---|---|
| `anime-log-feature` | Orchestrator for adding a full new feature (table + API + UI) |
| `migrate` | Schema changes only — creates and applies D1 migrations |
| `server-feature` | Add a Hono route and TypeScript types |
| `client-feature` | Add a Vue composable and component |
| `api-test` | Test API endpoints against the local dev server |
| `db-query` | Run a SQL query against the local D1 database |

## Keeping skills and rules up to date

After any code change, check whether `.claude/rules/` or `.claude/skills/` need updating:

- Modified server code → review `rules/server.md` and `skills/server-feature/SKILL.md`
- Modified Vue components → review `rules/vue.md` and `skills/client-feature/SKILL.md`
- Modified composables → review `rules/composables.md` and `skills/client-feature/SKILL.md`
- Modified migrations → review `rules/migrations.md` and `skills/migrate/SKILL.md`
- Added or removed a feature layer → review `skills/anime-log-feature/SKILL.md`

Update the relevant files immediately when conventions change or new patterns emerge. Do not defer.

## Conventions

Coding conventions are in `.claude/rules/` (path-scoped, auto-loaded when editing matching files):

- `migrations.md` — D1/SQLite schema patterns (`migrations/**`)
- `server.md` — Hono route and D1 query conventions (`src/server/**`)
- `vue.md` — Vue 3 component conventions (`src/client/**/*.vue`)
- `composables.md` — Composable conventions: singleton pattern, race guard, mutation→re-fetch (`src/client/composables/*.ts`)
- `testing.md` — Test structure, patterns, and what to test/skip (`**/*.test.ts`)

## Architecture

This is a **Cloudflare Workers + D1 + Hono** backend serving a **Vue 3** MPA (two pages: viewer and admin).

### Request flow

```
Browser → Vite dev server (port 5173)
            ├── /api/*       → @cloudflare/vite-plugin → Worker (src/server/index.ts via Hono)
            └── /*           → Static files (src/client/)
```

In production, the Worker serves everything: API routes via Hono, static assets from `dist/client/` via the `assets` binding.

### Shared (`src/shared/`)

Types, schemas, and constants shared between the server and client. Both sides import from the `@shared` alias (configured in `vite.config.ts` and the tsconfig files).

- `types.ts` — Canonical API response types (`Title`, `CastMember`, `TitleDetail`, `HistoryEntry`, `VoiceResult`, `CastInput`). Import these on both server and client instead of duplicating type definitions.
- `constants.ts` — `Tab`, `AdminTab` union types derived from `as const` arrays. No Cloudflare-specific types here.
- `schemas/common.ts` — `idParam = z.coerce.number().int().positive()` for path parameter validation.

Never import Cloudflare Workers types (`D1Database`, etc.) into `src/shared/` — they are not available in the client build.

### Server (`src/server/`)

- `index.ts` — Hono app entry. Defines `Bindings = { DB: D1Database; API_TOKEN: string }` and mounts three route modules. Global `onError` handles ZodError → 400 and UNIQUE constraint → 409.
- `middleware/auth.ts` — Bearer token middleware for write endpoints. Token stored as a Cloudflare secret (`wrangler secret put API_TOKEN`).
- `routes/titles.ts` — CRUD for titles + per-title cast routes (`GET/POST/PUT /:id/cast`).
- `routes/cast.ts` — Cross-title voice actor search (`GET /api/cast?actor=...`) and individual cast PATCH/DELETE.
- `routes/history.ts` — Watch history CRUD with `PUT /api/history/reorder` (accepts `{ ids: number[] }` for bulk sort_order update via D1 batch).
- `lib/batch.ts` — `asBatch` and `batchAll` helpers for D1 batch operations.

Partial updates use `PATCH` (not `PUT`). All `PATCH`/`DELETE` handlers check existence → 404. Path params are validated with `idParam.parse()` from `@shared/schemas/common`.

### Client (`src/client/`)

Two independent Vue 3 apps (MPA). Each mounts via `createApp(App).mount("#app")`.

- `index.html` + `viewer/` — Read-only anime viewer. 3-panel layout (titles / cast / voice actor search).
- `admin.html` + `admin/` — CRUD admin UI. Token stored in `localStorage` as `api_token` via `useAuth`.

- `composables/` — shared Vue composables (module-level singleton pattern):
  - `useAuth.ts` — token state, `isAuthenticated`, `setToken`, `clearToken`.
  - `useFilter.ts` — reactive text filter with multi-word regex.
  - `useTitles.ts` — title list state with `error`/`loading`.
  - `useCastView.ts` — viewer: selected title detail + voice actor search, race guard.
  - `useCastEdit.ts` — admin: cast write operations (add, update, delete, replace).
  - `useHistory.ts` — history list CRUD + reorder with `error`/`loading`.
  - `useDataPortability.ts` — import/export logic for admin toolbar.

- `lib/api.ts` — Fetch wrapper. `get()` is unauthenticated; `post()`, `patch()`, `put()`, `del()` attach Bearer token. Use `patch` for partial updates; `put` only for full-replacement (reorder).
- `lib/raceToken.ts` — `createRaceToken()` for cancellable async loads.
- `styles/base.css` — Global CSS custom properties and resets.

### Database schema

Schema source of truth: `src/server/db/schema.ts` (Drizzle ORM `sqliteTable` definitions).

Three tables in D1 (SQLite):
- `titles` (id, title UNIQUE, year, timestamps)
- `cast_members` (title_id FK→titles CASCADE, actor_name, character_name, sort_order, updated_at NOT NULL with default)
- `history` (title_id FK→titles CASCADE, display_name nullable, year, sort_order, updated_at NOT NULL with default)

Indexes: `idx_cast_title_sort` on cast_members(title_id, sort_order); `idx_history_sort_order` on history(sort_order).

To add columns or tables: edit `schema.ts` → `pnpm db:generate` → `pnpm db:migrate`.

### Vite config notes

- Vue plugin (`@vitejs/plugin-vue`) listed before `cloudflare()` in plugins array.
- `root: 'src/client'` — enables clean dev URLs (`/` instead of `/src/client/`).
- `environments.client.build` holds `rollupOptions.input` (not top-level `build`) — putting it at top-level causes `@cloudflare/vite-plugin` to inject HTML files into the worker bundle.
- `persistState: { path: resolve(__dirname, '.wrangler/state') }` — forces the plugin to use the project-root `.wrangler/state` instead of creating a separate one under `src/client/.wrangler/state`.
- Worker build output goes to `dist/anime_log/`; client assets to `dist/client/`. The generated `dist/anime_log/wrangler.json` references `"assets": {"directory": "../client"}`.

### Data management

Two workflows for moving data in and out:

**Local DB initialization** — seed from `data/data.{json,js}` + `data/history.{json,js}` (gitignored):
```bash
pnpm db:reset         # apply schema only
pnpm dev              # start dev server (separate terminal)
pnpm seed:local       # auto-detects .json (preferred) or legacy .js (PAGE.data / PAGE.history), POSTs to localhost
```

**Backup and restore via Admin UI** — the recommended round-trip for everyday use:
- Export: Admin UI → Export button → saves `data.json` + `history.json` locally
- Import: Admin UI → Import button → select both files → confirm

Both import endpoints (`POST /api/import/data`, `POST /api/import/history`) require `?confirm=replace-all` and a Bearer token. They perform a full destructive replace (all existing titles/cast/history are deleted first).

## Deployment

### ⚠️ GitHub Actions CI/CD is not yet active

Workflow files are saved as drafts in `docs/workflows-draft/` and have not been deployed to `.github/workflows/`. No CI or auto-deploy will run on GitHub until they are moved into place.

**To activate CI/CD**, complete the setup checklist below, then:

```bash
mkdir -p .github/workflows
cp docs/workflows-draft/ci.yml .github/workflows/
cp docs/workflows-draft/deploy.yml .github/workflows/
```

Then restore the `workflow_run` trigger in `deploy.yml` (currently `workflow_dispatch` only):

```yaml
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]
  workflow_dispatch:
```

### Setup checklist (complete before activating CI/CD)

1. `wrangler d1 create anime-db` → note the `database_id`
2. `wrangler secret put API_TOKEN` (Cloudflare secret for the Worker)
3. Register three GitHub Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`
4. Move workflow files into `.github/workflows/` (see above)
5. Test a manual deploy via `workflow_dispatch` from the Actions tab
6. Restore the `workflow_run` trigger in `deploy.yml`

### Day-to-day (once CI/CD is active)

- Push to `main` → CI passes → deploy runs automatically

### wrangler.toml

`wrangler.toml` is committed with a `__DATABASE_ID__` placeholder. It works as-is for local development — local D1 uses the filesystem and ignores the `database_id` value. Before deploying, the GitHub Actions workflow runs `scripts/render-wrangler-toml.mjs` to replace the placeholder with the real ID from the `CLOUDFLARE_D1_DATABASE_ID` secret.
