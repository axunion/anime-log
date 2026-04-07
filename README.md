# anime-log

Personal anime watch log with cast/voice actor database.

Built with Cloudflare Workers + D1 + Hono + Vite 8 + TypeScript.

## Features

- Browse anime titles with full cast lists
- Search by voice actor across all titles
- Watch history tracking
- Admin UI for managing titles, cast, and history

## Development

```bash
pnpm install
pnpm dev        # http://localhost:5173
```

Requires `data/data.js` and `data/history.js` (not committed) for the local database.
See [CLAUDE.md](CLAUDE.md) for full setup and architecture details.

## Deployment

```bash
wrangler d1 create anime-db   # create remote DB, paste ID into wrangler.toml
pnpm db:migrate:remote        # apply schema + seed
wrangler secret put API_TOKEN # set admin API token
pnpm deploy
```
