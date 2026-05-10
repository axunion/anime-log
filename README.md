# anime-log

Personal anime watch log with cast and voice actor database.

Built with Cloudflare Workers + D1 (SQLite) + Hono + Vite + Vue 3 + TypeScript.

## Features

- Browse anime titles with full cast lists
- Search by voice actor across all titles
- Watch history tracking with drag-and-drop reordering
- Admin UI for managing titles, cast, and history

## Architecture

Two-page Vue 3 MPA (viewer + admin) served by a Cloudflare Worker. The Worker handles both the Hono API (`/api/*`) and static assets in production. In development, `@cloudflare/vite-plugin` unifies Vite HMR and the Worker into a single dev server — there is no separate client-only mode.

---

## Local Development

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io) (`npm install -g pnpm`)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`pnpm add -g wrangler`)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up the local database

The dev server uses a local D1 (SQLite) database stored under `.wrangler/state/`.

**Schema only (empty database):**

```bash
pnpm db:migrate
```

This applies `migrations/0001_schema.sql` and creates empty `titles`, `cast_members`, and `history` tables. The app works but shows no data.

**With seed data from legacy JS files:**

If you have `data/data.js` and `data/history.js` (the legacy export format):

```bash
pnpm migrate:generate   # generates migrations/0002_seed.sql from data/data.js + data/history.js
pnpm db:migrate         # applies all pending migrations including the seed
```

`migrate:generate` warns about history entries whose title does not exist in `data.js` and creates placeholder title rows for them.

**With manually written seed data:**

Copy the example and edit it:

```bash
cp migrations/0002_seed.sql.example migrations/0002_seed.sql
# edit migrations/0002_seed.sql
pnpm db:migrate
```

### 3. Start the dev server

```bash
pnpm dev
```

Opens at **http://localhost:5173**. The dev server runs both Vite (HMR) and the Cloudflare Worker simultaneously — API calls go to the local Worker backed by the local D1 database.

| Page | URL |
|------|-----|
| Viewer (read-only) | http://localhost:5173/ |
| Admin UI | http://localhost:5173/admin.html |

The admin UI requires an API token. In dev mode any non-empty string works — enter it in the Admin UI token field (stored in `localStorage`).

---

## Other Commands

```bash
pnpm typecheck   # TypeScript type check (vue-tsc --noEmit)
pnpm fix         # Biome lint + auto-fix (all files, respects .gitignore)
pnpm test        # Run all tests (client composables + server routes)
pnpm build       # Production build → dist/client/ and dist/anime_log/
```

---

## Deployment

### Cloudflare prerequisites

1. **Cloudflare account** — [sign up](https://dash.cloudflare.com/sign-up) if you don't have one (free tier is sufficient)
2. **Log in with Wrangler:**
   ```bash
   wrangler login
   ```
3. **Workers & D1** must be enabled on your account (available on the free tier)

### Deployment steps

**1. Create the D1 database:**

```bash
wrangler d1 create anime-db
```

Copy the `database_id` from the output and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "anime-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"   # ← paste here
```

**2. Apply migrations to the remote database:**

```bash
pnpm db:migrate:remote
```

To also apply seed data, make sure `migrations/0002_seed.sql` exists first (see [With seed data](#with-seed-data-from-legacy-js-files) above), then run the command above.

**3. Set the admin API token:**

```bash
wrangler secret put API_TOKEN
```

Enter any secure random string when prompted. This is the token you will use in the Admin UI.

**4. Deploy:**

```bash
pnpm deploy
```

This builds the client and Worker, then uploads both to Cloudflare. The Worker URL is shown in the output (e.g. `https://anime-log.<your-subdomain>.workers.dev`).
