# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

> **Sync:** This file and `CLAUDE.md` contain the same guidance. When updating one, update the other to match.

## Language

Write the following in **English only**:
- In-code comments, console output, error messages, log messages
- Commit messages, README files, AI-readable config files (CLAUDE.md, AGENT.md, etc.)

Communicate with the user in **Japanese**.

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
- Extract a helper only when used in 3+ places; otherwise inline it.
- One concern per file; split when a file exceeds ~300 lines.
- Delete dead code; never comment it out.

## Testing

- Write tests before or alongside implementation.
- Test observable outcomes and edge cases, not implementation details.
- Each test must be fully self-contained; no shared mutable state between tests.

Test environment details and helpers are in `.claude/rules/testing.md`.

## Commits

Format:

```
<one-line summary>

<Why: one sentence — motivation or problem>

- <change 1>
- <change 2>
```

- Summary: imperative mood, ≤70 chars, no trailing period, no prefix tags (`feat:`, `fix:`, etc.).
- Why line: include only when motivation is not evident from the diff alone.
- Bullets: include only for 2+ distinct changes.
- Never commit secrets (`*.key`, `*.pem`, `credentials*`).
- Never use `--no-verify` or `--amend`; always create a new commit.

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

## Conventions

Coding conventions are in `.claude/rules/` (path-scoped, auto-loaded when editing matching files):

- `migrations.md` — D1/SQLite schema patterns (`migrations/**`)
- `server.md` — Hono route and D1 query conventions (`src/server/**`)
- `vue.md` — Vue 3 component conventions (`src/client/**/*.vue`)
- `composables.md` — Composable conventions: singleton pattern, race guard, mutation→re-fetch (`src/client/composables/*.ts`)
- `testing.md` — Test structure, patterns, and what to test/skip (`**/*.test.ts`)

## Keeping rules up to date

After any code change, check whether `.claude/rules/` needs updating:

- Modified server code → review `rules/server.md`
- Modified Vue components → review `rules/vue.md`
- Modified composables → review `rules/composables.md`
- Modified migrations → review `rules/migrations.md`

Update the relevant files immediately when conventions change or new patterns emerge. Do not defer.

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

- `index.ts` — Hono app entry. Defines `Bindings = { DB: D1Database; API_TOKEN: string; ASSETS: Fetcher }` and mounts five route modules. Global `onError` handles ZodError → 400 and UNIQUE constraint → 409. Admin page routing and ASSETS proxy are handled here (not in route modules).
- `middleware/auth.ts` — Bearer token middleware for write endpoints. Token configured via Cloudflare Dashboard in production, `.dev.vars` in local development.
- `routes/titles.ts` — CRUD for titles + per-title cast routes (`GET/POST/PUT /:id/cast`).
- `routes/cast.ts` — Cross-title voice actor search (`GET /api/cast?actor=...`) and individual cast PATCH/DELETE.
- `routes/history.ts` — Watch history CRUD with `PUT /api/history/reorder` (accepts `{ ids: number[] }` for bulk sort_order update via D1 batch).
- `routes/export.ts` — `GET /api/export/data` and `/api/export/history` — download all titles/cast/history as JSON.
- `routes/import.ts` — `POST /api/import/data` and `/api/import/history` — full destructive replace (requires `?confirm=replace-all` and Bearer token).
- `lib/batch.ts` — `asBatch` and `batchAll` helpers for D1 batch operations.

Partial updates use `PATCH` (not `PUT`). All `PATCH`/`DELETE` handlers check existence → 404. Path params are validated with `idParam.parse()` from `@shared/schemas/common`.

The `/:secret` admin route compares the path segment against `API_TOKEN` with `timingSafeEqual`. On match it serves `admin.html` with the token injected via `<meta name="x-api-token">`. Requests to `/admin.html`, `/admin`, and `/admin/` return 404 directly. Unmatched non-API paths proxy to `ASSETS`.

### Client (`src/client/`)

Two independent Vue 3 apps (MPA). Each mounts via `createApp(App).mount("#app")`.

- `index.html` + `viewer/` — Read-only anime viewer. 3-panel layout (titles / cast / voice actor search).
- `admin.html` + `admin/` — CRUD admin UI. Token stored in `localStorage` as `api_token` via `useAuth`.

- `composables/` — shared Vue composables (module-level singleton pattern):
  - `useAuth.ts` — token state, `setToken`, `getToken`. Token is injected via `<meta name="x-api-token">` on secret URL access and persisted to `localStorage`.
  - `useFilter.ts` — reactive text filter with multi-word regex.
  - `useTitles.ts` — title list state with `error`/`loading`.
  - `useCastView.ts` — viewer: selected title detail + voice actor search, race guard.
  - `useCastEdit.ts` — admin: cast write operations (add, update, delete, replace).
  - `useCast.ts` — compat shim re-exporting both `useCastView` and `useCastEdit`.
  - `useHistory.ts` — history list CRUD + reorder with `error`/`loading`.
  - `useConfirm.ts` — confirmation dialog state; pair with `<ConfirmDialog />` in each app's root `App.vue`.
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

Both import endpoints require `?confirm=replace-all` and a Bearer token, and perform a full destructive replace.

## Deployment

Workflow files are active in `.github/workflows/` (source of truth):

- **CI** (`ci.yml`) — runs on every push to `main` and on PRs: `pnpm check` + `pnpm test`.
- **Deploy** (`deploy.yml`) — triggered manually via `workflow_dispatch`. The `dry_run` input (default: `true`) runs check + test + build + `wrangler deploy --dry-run` without touching production. Set `dry_run=false` for a real deploy.

### First-time setup

1. `wrangler d1 create anime-db` → note the `database_id`
2. Set `API_TOKEN` via Cloudflare Dashboard (Workers & Pages → `anime-log` → Settings → Variables and Secrets). Use a random 16–24 char string (e.g. `openssl rand -hex 12`). This value is also the admin URL path segment.
3. Register three GitHub Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`
4. Trigger Deploy with `dry_run=true` to verify, then `dry_run=false` for the first real deploy.

`wrangler.toml` is committed with a `__DATABASE_ID__` placeholder. The CI/CD workflow replaces it with the real ID from `CLOUDFLARE_D1_DATABASE_ID` via `scripts/render-wrangler-toml.mjs`.

### Admin page access

Access the admin page via the secret URL — it is not served at `/admin.html`:

```
https://<your-worker>.workers.dev/<API_TOKEN>
```

Subsequent visits auto-authenticate (token stored in `localStorage`). For local development:
```
http://localhost:5173/<API_TOKEN from .dev.vars>
```

To rotate the token: update `API_TOKEN` in Cloudflare Dashboard → re-bookmark the new URL.
