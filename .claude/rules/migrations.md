---
paths: ["migrations/**"]
---

# Migration Conventions (Cloudflare D1 / SQLite)

## File naming

`migrations/NNNN_descriptive_name.sql` — increment NNNN from the highest existing file.

Never modify `0002_seed.sql` — it contains personal data and is gitignored.

## Schema patterns

```sql
CREATE TABLE my_table (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  some_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
  -- mutable tables also get: updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index every FK column
CREATE INDEX idx_my_table_title_id ON my_table(title_id);
```

## SQLite-only syntax

D1 is SQLite — avoid all Postgres-isms:

| Use | Never use |
|-----|-----------|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL` |
| `TEXT DEFAULT (datetime('now'))` | `TIMESTAMP`, `NOW()` |
| `TEXT` | `VARCHAR`, `ENUM` |
| `ALTER TABLE t ADD COLUMN ...` | `DROP COLUMN`, `RENAME COLUMN` (not supported in older D1) |

## After writing a migration

```bash
pnpm db:migrate          # apply locally
pnpm exec wrangler d1 execute anime-db --local --command "SELECT name FROM sqlite_master WHERE type='table'"
```

Remember: run `pnpm db:migrate:remote` before deploying to production.
