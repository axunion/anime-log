---
paths: ["migrations/**"]
---

# Migration Conventions (Cloudflare D1 / SQLite + Drizzle Kit)

## Workflow

Schema changes are driven by `src/server/db/schema.ts`. The standard workflow:

```bash
# 1. Edit src/server/db/schema.ts
# 2. Generate migration SQL
pnpm db:generate        # drizzle-kit generate → creates migrations/NNNN_xxx.sql

# 3. Apply locally
pnpm db:migrate         # wrangler d1 migrations apply anime-db --local

# 4. Verify
pnpm exec wrangler d1 execute anime-db --local --command "PRAGMA table_info(my_table)"

# 5. Before deploying
pnpm db:migrate:remote
```

Never write migration SQL by hand — always let `drizzle-kit generate` produce the diff.

## File naming

Files follow `NNNN_descriptive_name.sql` format. Drizzle Kit generates the next number automatically.

Never modify `0002_seed.sql` — it contains personal data and is gitignored.

## Schema patterns in schema.ts

```ts
import { sql } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const my_table = sqliteTable("my_table", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title_id: integer("title_id")
    .notNull()
    .references(() => titles.id, { onDelete: "cascade" }),
  some_text: text("some_text").notNull(),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index("idx_my_table_title_id").on(t.title_id),
])
```

## Adding updated_at to an existing table

SQLite prohibits `DEFAULT (datetime('now'))` in `ALTER TABLE ADD COLUMN`. Add it as nullable in schema.ts and set it explicitly in UPDATE handlers:

```ts
// In schema.ts — nullable (ALTER TABLE cannot have function default)
updated_at: text("updated_at")
```

```ts
// In route handler
await c.env.DB.prepare("UPDATE my_table SET ..., updated_at = datetime('now') WHERE id = ?").bind(id).run()
```

## SQLite-only constraints

D1 is SQLite — avoid Postgres-isms:

| Use | Never use |
|-----|-----------|
| `integer("id").primaryKey({ autoIncrement: true })` | `SERIAL` |
| `text("created_at").default(sql\`(datetime('now'))\`)` | `TIMESTAMP`, `NOW()` |
| `text("name")` | `VARCHAR`, `ENUM` |

## Baseline note

`migrations/0003_drizzle_baseline.sql` is an empty marker that tells Drizzle Kit the baseline state (schema as of 2026-05-17). Future `pnpm db:generate` will produce `0004_xxx.sql` and beyond. The `migrations/meta/` directory is committed and must not be deleted.
