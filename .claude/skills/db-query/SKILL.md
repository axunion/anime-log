---
name: db-query
description: Run a SQL query against the local D1 database (anime-db). Use when the user asks to inspect data, verify migrations, or debug database state.
---

Run the SQL provided by the user against the local D1 instance:

```bash
pnpm exec wrangler d1 execute anime-db --local --command "<SQL>"
```

- For SELECT queries: display results as a table
- For INSERT/UPDATE/DELETE: report the number of rows affected
- If no SQL is provided: show table list with `SELECT name FROM sqlite_master WHERE type='table'`
