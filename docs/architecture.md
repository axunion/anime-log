# Architecture Reference

Detailed reference for this repo's structure. `AGENTS.md` has the operational rules; this file has the "how it's wired" facts.

This is a **Cloudflare Workers + D1 + Hono** backend serving a **Vue 3** MPA (two pages: viewer and admin).

## Request flow

```
Browser → Vite dev server (port 5173)
            ├── /api/*       → @cloudflare/vite-plugin → Worker (src/server/index.ts via Hono)
            └── /*           → Static files (src/client/)
```

In production, the Worker serves everything: API routes via Hono, static assets from `dist/client/` via the `assets` binding.

## Shared (`src/shared/`)

Types, schemas, and constants shared between server and client, imported via the `@shared` alias.

- `types.ts` — Canonical API response types (`Title`, `CastMember`, `TitleDetail`, `HistoryEntry`, `VoiceResult`, `CastInput`). Import these on both sides instead of duplicating type definitions.
- `constants.ts` — `Tab`, `AdminTab` union types derived from `as const` arrays. No Cloudflare-specific types here.
- `schemas/common.ts` — `idParam = z.coerce.number().int().positive()` for path parameter validation, plus input size caps (`MAX_NAME_LENGTH = 200`, `MAX_CAST_PER_TITLE = 500`, `MAX_IMPORT_ROWS = 10000`) applied to all string/array inputs in server schemas.

Never import Cloudflare Workers types (`D1Database`, etc.) into `src/shared/` — they are not available in the client build.

## Server (`src/server/`)

- `index.ts` — Hono app entry. Defines `Bindings = { DB: D1Database; API_TOKEN: string; ASSETS: Fetcher; RATE_LIMITER?: RateLimit; WRITE_RATE_LIMITER?: RateLimit }` and mounts five route modules. Global `onError` handles ZodError → 400 and UNIQUE constraint → 409. Admin page routing, ASSETS proxy, and per-IP rate limiting middleware are handled here (not in route modules). Rate limit bindings come from `[[ratelimits]]` in `wrangler.toml` (global: 300 req/min, writes: 60 req/min per IP per Cloudflare location); they are absent in tests and requests pass through unlimited.
- `middleware/auth.ts` — Bearer token middleware for write endpoints. Token configured via Cloudflare Dashboard in production, `.dev.vars` in local development.
- `routes/titles.ts` — CRUD for titles + per-title cast routes (`GET/POST/PUT /:id/cast`).
- `routes/cast.ts` — Cross-title voice actor search (`GET /api/cast?actor=...`) and individual cast PATCH/DELETE.
- `routes/history.ts` — Watch history CRUD with `PUT /api/history/reorder` (accepts `{ ids: number[] }` for bulk sort_order update via D1 batch).
- `routes/export.ts` — `GET /api/export/data` and `/api/export/history` — download all titles/cast/history as JSON.
- `routes/import.ts` — `POST /api/import/data` and `/api/import/history` — full destructive replace (requires `?confirm=replace-all` and Bearer token).
- `lib/batch.ts` — `asBatch` and `batchAll` helpers for D1 batch operations.

Partial updates use `PATCH` (not `PUT`). All `PATCH`/`DELETE` handlers check existence → 404. Path params are validated with `idParam.parse()` from `@shared/schemas/common`.

The `/:secret` admin route compares the path segment against `API_TOKEN` with `timingSafeEqual`. On match it serves `admin.html` with the token injected via `<meta name="x-api-token">`. Requests to `/admin.html`, `/admin`, and `/admin/` return 404 directly. Unmatched non-API paths proxy to `ASSETS`.

## Client (`src/client/`)

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

## Database schema

Schema source of truth: `src/server/db/schema.ts` (Drizzle ORM `sqliteTable` definitions).

Three tables in D1 (SQLite):
- `titles` (id, title UNIQUE, year, timestamps)
- `cast_members` (title_id FK→titles CASCADE, actor_name, character_name, sort_order, updated_at NOT NULL with default)
- `history` (title_id FK→titles CASCADE, display_name nullable, year, sort_order, updated_at NOT NULL with default)

Indexes: `idx_cast_title_sort` on cast_members(title_id, sort_order); `idx_history_sort_order` on history(sort_order).

To add columns or tables: edit `schema.ts` → `pnpm db:generate` → `pnpm db:migrate`.

To query the local D1 database directly:
```bash
pnpm exec wrangler d1 execute anime-db --local --command "SELECT COUNT(*) FROM titles"
```

## Vite config notes

- Vue plugin (`@vitejs/plugin-vue`) listed before `cloudflare()` in plugins array.
- `root: 'src/client'` — enables clean dev URLs (`/` instead of `/src/client/`).
- `environments.client.build` holds `rollupOptions.input` (not top-level `build`) — putting it at top-level causes `@cloudflare/vite-plugin` to inject HTML files into the worker bundle.
- `persistState: { path: resolve(__dirname, '.wrangler/state') }` — forces the plugin to use the project-root `.wrangler/state` instead of creating a separate one under `src/client/.wrangler/state`.
- Worker build output goes to `dist/anime_log/`; client assets to `dist/client/`. The generated `dist/anime_log/wrangler.json` references `"assets": {"directory": "../client"}`.

## Data management

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
