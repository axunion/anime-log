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

- Node.js 24+
- [pnpm](https://pnpm.io) (`npm install -g pnpm`)

Wrangler is included in `devDependencies` — no global install needed. All `wrangler` commands work via pnpm scripts or `pnpm exec wrangler <cmd>`.

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create `.dev.vars`

Create a `.dev.vars` file in the project root. This file is gitignored and holds local secrets for the Cloudflare Worker dev server:

```
API_TOKEN=any-string-you-choose
```

Choose any string — this becomes the local admin access token.

### 3. Set up the local database

The dev server uses a local D1 (SQLite) database stored under `.wrangler/state/`.

Apply the schema migrations to create empty tables:

```bash
pnpm db:migrate
```

This creates `titles`, `cast_members`, and `history` tables. The app works but shows no data yet.

### 4. Start the dev server

```bash
pnpm dev
```

Opens at **http://localhost:5173**. The dev server runs both Vite (HMR) and the Cloudflare Worker simultaneously — API calls go to the local Worker backed by the local D1 database.

| Page | URL |
|------|-----|
| Viewer (read-only) | `http://localhost:5173/` |
| Admin UI | `http://localhost:5173/<API_TOKEN>` |

Replace `<API_TOKEN>` with the value you set in `.dev.vars`. For example, if you used `API_TOKEN=mysecret`, open `http://localhost:5173/mysecret`.

Bookmark this URL — it authenticates automatically on every visit and there is no separate login step.

### 5. Load initial data

There are two ways to move data in and out.

#### Seed local DB from JSON files (CLI)

Place `data/data.json` and `data/history.json` (gitignored) in the project root — use the Admin UI Export button to obtain these files — then run with the dev server running:

```bash
# Terminal 1 (keep running)
pnpm dev

# Terminal 2
pnpm seed:local
```

`seed:local` always targets `http://localhost:5173` and reads the token from `.dev.vars`.

#### Backup and restore via Admin UI

The recommended round-trip for everyday backups:

- **Export:** Admin UI → Export button → saves `data.json` + `history.json` locally.
- **Import:** Admin UI → Import button → select both files → confirm.

---

## Data Format

The export/import JSON format is the same for both the Admin UI and the CLI scripts.

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
pnpm build       # Build locally for verification — deploy goes through GitHub Actions
pnpm db:reset    # Wipe local D1 state and re-apply all migrations (fresh local DB)
```

Git hooks are managed by [lefthook](https://lefthook.dev) and installed automatically via `pnpm install`. On every `git commit`, Biome runs on staged files (with auto-fix) and `vue-tsc` runs in parallel.

---

## Deployment

**All production changes go through GitHub Actions — never deploy or write to production from a local machine.**

Every push to `main` triggers a deploy pipeline: lint → test → D1 migrations → build → deploy. You can also trigger a deploy manually from the Actions tab.

### First-time setup

These steps are required once when setting up a new environment.

**1. Cloudflare prerequisites:**

- [Sign up](https://dash.cloudflare.com/sign-up) for a Cloudflare account (free tier is sufficient)
- Ensure Workers & D1 are enabled on your account

**2. Create the D1 database:**

```bash
pnpm exec wrangler d1 create anime-db
```

Note the `database_id` from the output — you'll need it in step 4.

**3. Set the admin token (Cloudflare Dashboard):**

Go to **Cloudflare Dashboard → Workers & Pages → `anime-log` → Settings → Variables and Secrets**, then add a secret named `API_TOKEN`.

Use a random string of 16–24 characters (e.g. generated with `openssl rand -hex 12`). Keep this value — it is the URL path used to access the Admin UI in production.

> Do not use `wrangler secret put` from a local machine. All secrets for this project are managed through the Cloudflare Dashboard to keep local and production environments fully separated.

**4. Register GitHub Secrets:**

Go to your repository → Settings → Secrets and variables → Actions, and add:

| Secret name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | A Cloudflare API token with `Workers Scripts:Edit` and `D1:Edit` permissions (create at Cloudflare dashboard → My Profile → API Tokens) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID (shown in the dashboard sidebar) |
| `CLOUDFLARE_D1_DATABASE_ID` | The `database_id` from step 2 |

**5. Trigger the first deploy:**

Push to `main` or trigger manually from the GitHub Actions tab. The deploy pipeline injects the real database ID, applies D1 migrations, builds, and deploys automatically. The Worker URL is shown in the deploy step output (e.g. `https://anime-log.<your-subdomain>.workers.dev`).

**6. Access the Admin UI in production:**

Open `https://<your-worker-url>/<API_TOKEN>` in your browser and bookmark it. The page authenticates automatically — no separate login step is needed on subsequent visits.

**7. Seed initial data (optional):**

Once logged in, use the Admin UI **Import** button to upload `data.json` and `history.json`.

### Rotating the admin token

If you need to change the `API_TOKEN`:

1. Update the secret value in **Cloudflare Dashboard → Workers & Pages → `anime-log` → Settings → Variables and Secrets**
2. Trigger a redeploy (push a commit or use `workflow_dispatch` from the Actions tab)
3. Update your bookmark with the new URL

### Day-to-day workflow

1. Create a branch and make changes
2. Open a PR — CI runs lint, typecheck, and tests automatically
3. Merge to `main` — deploy pipeline runs automatically
