# anime-log

Personal anime watch log with cast and voice actor database.

Built with Cloudflare Workers + D1 (SQLite) + Hono + Vite + Vue 3 + TypeScript.

## Features

- Browse anime titles with full cast lists
- Search by voice actor across all titles
- Watch history tracking with drag-and-drop reordering
- Admin UI for managing titles, cast, and history
- Export/import data as JSON

## Architecture

Two-page Vue 3 MPA (viewer + admin) served by a Cloudflare Worker. The Worker handles both the Hono API (`/api/*`) and static assets in production. In development, `@cloudflare/vite-plugin` unifies Vite HMR and the Worker into a single dev server.

---

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create `.dev.vars`

```
API_TOKEN=any-string-you-choose
```

This file is gitignored. The value becomes the local admin access token.

### 3. Set up the local database

```bash
pnpm db:migrate
```

### 4. Start the dev server

```bash
pnpm dev
```

Opens at **http://localhost:5173**.

| Page | URL |
|------|-----|
| Viewer (read-only) | `http://localhost:5173/` |
| Admin UI | `http://localhost:5173/<API_TOKEN>` |

### 5. Load initial data

**Via Admin UI (recommended):** Import → select `data.json` + `history.json`.

**Via CLI:** place `data/data.json` and `data/history.json` in the project root, then:

```bash
pnpm seed:local   # requires pnpm dev running in another terminal
```

---

## Commands

```bash
pnpm typecheck   # TypeScript type check
pnpm fix         # Biome lint + auto-fix
pnpm test        # Run all tests (client composables + server routes)
pnpm build       # Build locally — deploy goes through GitHub Actions
pnpm db:reset    # Wipe local D1 and re-apply all migrations
```

Git hooks (lefthook) run Biome and `vue-tsc` automatically on every commit.

---

## Deployment

**All production changes go through GitHub Actions — never deploy or write to production from a local machine.**

Deploy is triggered manually from the GitHub Actions tab (`workflow_dispatch`). CI runs automatically on every push to `main` and on PRs.

### First-time setup

1. `wrangler d1 create anime-db` → note the `database_id`
2. Set `API_TOKEN` in Cloudflare Dashboard (Workers & Pages → `anime-log` → Settings → Variables and Secrets)
3. Add three GitHub Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`
4. Actions tab → Deploy → Run workflow → `dry_run=false`

`wrangler.toml` uses a `__DATABASE_ID__` placeholder that the pipeline replaces at deploy time.

### Admin UI in production

```
https://<your-worker>.workers.dev/<API_TOKEN>
```

Bookmark this URL — it authenticates automatically on every visit.
