---
name: migrate
description: >
  Create and apply a new D1 migration for the anime-log project. Use this skill when the user
  says "/migrate", "add a migration", "create a migration", "change the schema", "add a table",
  "add a column", or asks to extend the database. Also trigger this skill automatically when a
  new feature (via the anime-log-feature skill) requires schema changes.
---

# D1 Migration Creator (Drizzle Kit workflow)

This project uses Cloudflare D1 (SQLite) managed by Drizzle Kit. Schema is defined in
`src/server/db/schema.ts`. SQL conventions are in `.claude/rules/migrations.md`.

Baseline migration is `migrations/0000_salty_hydra.sql` (generated 2026-05-18 from `schema.ts`).
Future `pnpm db:generate` will produce `0001_xxx.sql` and beyond.

## Steps

### 1. Edit `src/server/db/schema.ts`

Add the new table or column following conventions in `.claude/rules/migrations.md`.

**Recommended timestamp pattern** — both `created_at` and `updated_at` must be `notNull()` with a default:

```ts
export const my_table = sqliteTable("my_table", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title_id: integer("title_id").notNull().references(() => titles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index("idx_my_table_title_id").on(t.title_id),
])
```

Both columns must be `notNull().default(sql\`(datetime('now'))\`)`. Never declare `updated_at` as nullable — it causes consistency issues with backfill logic in future migrations.

### 2. Generate the migration SQL

```bash
pnpm db:generate
```

This runs `drizzle-kit generate`, reads the diff vs the latest snapshot in `migrations/meta/`,
and writes a new `migrations/NNNN_xxx.sql` file.

**Always inspect the generated SQL** before applying. If the migration rebuilds a table (common when changing NOT NULL or adding columns), check that the data copy step uses `COALESCE` for any previously-nullable columns that are now NOT NULL:

```sql
-- Example backfill for updated_at that was previously nullable
INSERT INTO new_my_table SELECT id, name, sort_order, created_at, COALESCE(updated_at, created_at) FROM my_table;
```

If the generated SQL is missing this, edit the file manually before applying.

### 3. Apply locally

```bash
pnpm db:migrate
```

### 4. Verify

```bash
pnpm exec wrangler d1 execute anime-db --local --command "PRAGMA table_info(my_table)"
```

Confirm the new table or column appears.

### 5. Update types.ts

Export the new row type from `src/server/types.ts` (server-internal types only):

```ts
import type { InferSelectModel } from "drizzle-orm"
import type { my_table } from "./db/schema"

export type MyRow = InferSelectModel<typeof my_table>
```

Add shared API response types (fields exposed to client) to `src/shared/types.ts` instead.

### 6. Report

State the migration file path and confirm it applied cleanly. Remind the user:

> The GitHub Actions deploy pipeline applies remote migrations automatically. Commit and push to `main` to deploy.

## Important notes

- **Never hand-write migration SQL** — always use `pnpm db:generate` to get the diff.
- The `migrations/meta/` directory must stay committed; do not delete it.
- After creating the migration, a new feature also needs a Hono route and Vue composable —
  refer to the `anime-log-feature` skill for the full checklist.
