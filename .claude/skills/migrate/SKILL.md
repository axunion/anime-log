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

## Steps

### 1. Edit `src/server/db/schema.ts`

Add the new table or column following conventions in `.claude/rules/migrations.md`:

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

### 2. Generate the migration SQL

```bash
pnpm db:generate
```

This runs `drizzle-kit generate`, reads the diff vs `migrations/meta/0003_snapshot.json`,
and writes a new `migrations/NNNN_xxx.sql` file.

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

Export the new row type from `src/server/types.ts`:

```ts
import type { InferSelectModel } from "drizzle-orm"
import type { my_table } from "./db/schema"

export type MyRow = InferSelectModel<typeof my_table>
```

### 6. Report

State the migration file path and confirm it applied cleanly. Remind the user:

> Run `pnpm db:migrate:remote` before deploying to apply this migration to production.

## Important notes

- **Never touch `0002_seed.sql`** — it contains personal data and is gitignored.
- **Never hand-write migration SQL** — always use `pnpm db:generate` to get the diff.
- The `migrations/meta/` directory must stay committed; do not delete it.
- After creating the migration, a new feature also needs a Hono route and Vue composable —
  refer to the `anime-log-feature` skill for the full checklist.
