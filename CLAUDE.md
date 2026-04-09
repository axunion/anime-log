# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

- Commit messages, code comments, and README files must be written in **English**.
- Communication with the user is in Japanese.

## Commands

```bash
pnpm dev              # Start dev server with Cloudflare Worker + Vite HMR (http://localhost:5173)
pnpm build            # Build client (dist/client/) and worker (dist/anime_log/)
pnpm deploy           # Build then deploy to Cloudflare (requires valid database_id in wrangler.toml)

pnpm migrate:generate # Regenerate migrations/0002_seed.sql from data/data.js + data/history.js
pnpm db:migrate       # Apply migrations to local D1
pnpm db:migrate:remote # Apply migrations to remote D1
```

To query the local D1 database directly:
```bash
pnpm exec wrangler d1 execute anime-db --local --command "SELECT COUNT(*) FROM titles"
```

## Architecture

This is a **Cloudflare Workers + D1 + Hono** backend serving a **Vue 3** MPA (two pages: viewer and admin).

### Request flow

```
Browser → Vite dev server (port 5173)
            ├── /api/*       → @cloudflare/vite-plugin → Worker (src/server/index.ts via Hono)
            └── /*           → Static files (src/client/)
```

In production, the Worker serves everything: API routes via Hono, static assets from `dist/client/` via the `assets` binding.

### Server (`src/server/`)

- `index.ts` — Hono app entry. Defines `Bindings = { DB: D1Database; API_TOKEN: string }` and mounts three route modules.
- `middleware/auth.ts` — Bearer token middleware applied to all write endpoints (POST/PUT/DELETE). Token stored as a Cloudflare secret (`wrangler secret put API_TOKEN`).
- `routes/titles.ts` — CRUD for titles + cast batch insert on POST.
- `routes/cast.ts` — Cross-title voice actor search (`GET /api/cast?actor=...`) and per-title cast CRUD.
- `routes/history.ts` — Watch history CRUD with `PUT /api/history/reorder` (accepts `{ ids: number[] }` for bulk sort_order update via D1 batch).

### Client (`src/client/`)

Two independent Vue 3 apps (MPA). Each mounts via `createApp(App).mount("#app")`.

- `index.html` + `viewer/` — Read-only anime viewer (Vue 3 app).
  - `App.vue` — composes `useTitles`, `useCast`, `useHistory`; passes state to `ViewerLayout`.
  - `components/ViewerLayout.vue` — 3-panel layout with responsive CSS (3-col → 2-col → 1-col).
  - `components/TitleNav.vue` — tab navigation (History / Year / Name).
  - `components/TitleListBlock.vue` — filterable scrollable title list (uses `useFilter`).
  - `components/CastPanel.vue` + `CastRow.vue` — lazy-loaded cast table.
  - `components/VoicePanel.vue` + `VoiceItem.vue` — voice actor search results.
  - `components/ExternalLinks.vue` — Google/Wikipedia link header (shared).

- `admin.html` + `admin/` — CRUD admin UI (Vue 3 app). Token stored in `localStorage` as `api_token`.
  - `App.vue` — 2-col grid layout, composes `useTitles`.
  - `components/AdminHeader.vue` — token prompt.
  - `components/TitleManager.vue` — title search + add form (uses `useFilter`).
  - `components/CastEditor.vue` + `CastEditorRow.vue` — editable cast rows.
  - `components/HistoryManager.vue` + `HistoryItem.vue` — history CRUD + reorder.

- `composables/` — shared Vue composables:
  - `useFilter.ts` — reactive text filter with multi-word regex.
  - `useTitles.ts` — title list state (module-level singleton ref).
  - `useCast.ts` — selected title detail + voice actor search state.
  - `useHistory.ts` — history list CRUD + reorder.

- `lib/api.ts` — Shared fetch wrapper. `get()` is unauthenticated; `post()`, `put()`, `del()` attach the stored token as `Authorization: Bearer`.
- `styles/base.css` — Global CSS custom properties, resets, `.icon-wikipedia`.

### Database schema

Three tables in D1 (SQLite):
- `titles` (id, title UNIQUE, year, timestamps)
- `cast_members` (title_id FK→titles CASCADE, actor_name, character_name, sort_order)
- `history` (title_id FK→titles CASCADE, display_name, year, sort_order)

### Vite config notes

- Vue plugin (`@vitejs/plugin-vue`) listed before `cloudflare()` in plugins array.
- `root: 'src/client'` — enables clean dev URLs (`/` instead of `/src/client/`).
- `environments.client.build` holds `rollupOptions.input` (not top-level `build`) — putting it at top-level causes `@cloudflare/vite-plugin` to inject HTML files into the worker bundle.
- `persistState: { path: resolve(__dirname, '.wrangler/state') }` — forces the plugin to use the project-root `.wrangler/state` instead of creating a separate one under `src/client/.wrangler/state`.
- Worker build output goes to `dist/anime_log/`; client assets to `dist/client/`. The generated `dist/anime_log/wrangler.json` references `"assets": {"directory": "../client"}`.

### Data migration

`data/data.js` and `data/history.js` (gitignored) are legacy JS files with `PAGE.data = [...]` assignments. `scripts/migrate.ts` parses them via `eval()` (handles single-quoted keys), generates `migrations/0002_seed.sql`, and warns on history entries whose title doesn't exist in data.js (creates placeholder title rows).

`migrations/0002_seed.sql` is gitignored (personal data). `migrations/0002_seed.sql.example` serves as a template. Generate the real file with `pnpm migrate:generate`.

## Deployment checklist

1. `wrangler d1 create anime-db` → paste the `database_id` into `wrangler.toml`
2. `pnpm db:migrate:remote`
3. `wrangler secret put API_TOKEN`
4. `pnpm deploy`
