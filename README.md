# anime-log

Personal anime watch log with cast and voice actor database.

Built with Cloudflare Workers + D1 (SQLite) + Hono + Vite + Vue 3 + TypeScript.

## Features

- Browse anime titles with full cast lists
- Search by voice actor across all titles
- Watch history tracking with drag-and-drop reordering
- Admin UI for managing titles, cast, and history
- Export data as JSON (titles/cast and history separately)

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

Apply the schema migrations to create empty tables:

```bash
pnpm db:migrate
```

This creates `titles`, `cast_members`, and `history` tables. The app works but shows no data yet.

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

### 4. Load initial data

There are two ways to populate the database with your data.

#### Import from legacy JS files (CLI)

If you have `data/data.js` and `data/history.js` in the legacy `PAGE.data = [...]` format, use the seed script. The dev server must be running:

```bash
# Terminal 1 (keep running)
pnpm dev

# Terminal 2
API_TOKEN=<any-non-empty-string> pnpm seed:import
```

`seed:import` reads both files, automatically injects placeholder title rows for any history entries whose title is not in `data.js`, then POSTs to `POST /api/import/data` and `POST /api/import/history` in order.

The script also accepts JSON files (`data/data.json` / `data/history.json`) and falls back to the `.js` format if JSON is not found.

---

## Data Format

The export/import JSON format is the same for both the Admin UI and the seed script.

**Titles and cast** (`data.json`):

```json
[
  {
    "title": "Example Anime",
    "year": 2024,
    "cast": [
      ["Actor Name", "Character Name"],
      ["Actor Name 2", "Character Name 2"]
    ]
  }
]
```

**Watch history** (`history.json`):

```json
[
  { "title": "Example Anime", "year": 2024 },
  { "title": "Another Anime", "name": "Another Anime: Movie Edition", "year": 2023 }
]
```

- `title` must match an existing title in the titles table
- `name` (optional) is a display name shown in the history list instead of `title`
- Order in the array is preserved as the display sort order

---

## Other Commands

```bash
pnpm typecheck   # TypeScript type check (vue-tsc --noEmit)
pnpm fix         # Biome lint + auto-fix (all files, respects .gitignore)
pnpm test        # Run all tests (client composables + server routes)
pnpm build       # Production build → dist/client/ and dist/anime_log/
pnpm db:reset    # Wipe local D1 state and re-apply all migrations (fresh local DB)
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

**5. Seed initial data (optional):**

```bash
BASE_URL=https://anime-log.<your-subdomain>.workers.dev \
API_TOKEN=<your-api-token> \
pnpm seed:import
```
