---
name: migrate
description: >
  Create and apply a new D1 migration for the anime-log project. Use this skill when the user
  says "/migrate", "add a migration", "create a migration", "change the schema", "add a table",
  "add a column", or asks to extend the database. Also trigger this skill automatically when a
  new feature (via the anime-log-feature skill) requires schema changes.
---

# D1 Migration Creator

This project uses Cloudflare D1 (SQLite). Migrations live in `migrations/` as numbered SQL files.
SQL conventions are defined in `.claude/rules/migrations.md` — follow them exactly.

## Steps

### 1. Determine the next migration number

List `migrations/` and find the highest `NNNN` prefix. The new file must be named:
```
migrations/<NNNN+1>_<descriptive_snake_case_name>.sql
```

Example: if `0002_seed.sql` is the highest, the next file is `0003_<name>.sql`.

### 2. Write the SQL

Follow the conventions in `.claude/rules/migrations.md`:
- Table structure, column types, index patterns
- SQLite-only syntax (no Postgres-isms)

### 3. Apply locally

```bash
pnpm db:migrate
```

### 4. Verify

```bash
pnpm exec wrangler d1 execute anime-db --local --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

Confirm the new table (or column) appears.

### 5. Report

State the migration file path and confirm it applied cleanly. Remind the user:

> Run `pnpm db:migrate:remote` before deploying to apply this migration to production.

## Important notes

- **Never touch `0002_seed.sql`** — it contains personal data and is gitignored.
- Migration files are applied in lexicographic order, so the NNNN prefix must be correct.
- After creating the migration, this feature likely also needs a Hono route, TypeScript types,
  and a Vue composable — refer to the `anime-log-feature` skill for the full checklist.
