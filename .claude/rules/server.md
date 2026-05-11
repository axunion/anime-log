---
paths: ["src/server/**"]
---

# Server Conventions (Hono + Cloudflare D1)

## Auth middleware

- `authMiddleware` is required on all `POST` / `PUT` / `DELETE` handlers
- `GET` handlers must NOT use `authMiddleware`

```ts
titlesRoutes.post("/", authMiddleware, async (c) => { ... })
titlesRoutes.get("/", async (c) => { ... })
```

## Path parameters

Always parse with `Number()` — D1 bindings require numbers, not strings:

```ts
const id = Number(c.req.param("id"))
```

## Input validation

All `POST` and `PUT` handlers must validate request bodies with zod. Define schemas at the top of the file and call `.parse()` — `ZodError` is caught globally in `index.ts` and returned as `400 Bad Request`.

```ts
import { z } from "zod"

const createFoo = z.object({
  name: z.string().min(1),
  year: z.number().int(),
})

foosRoutes.post("/", authMiddleware, async (c) => {
  const body = createFoo.parse(await c.req.json())
  // ...
})
```

Do NOT use `c.req.json<T>()` with a TypeScript type alone — this provides no runtime validation.

## Error handling

- `ZodError` → 400 via global `app.onError` in `index.ts`
- All other errors → 500 with `{ error: "Internal Server Error" }` (no internal details exposed)
- Do not add per-route try/catch for validation — let it bubble to `onError`

## D1 queries

- Use `RETURNING id` on INSERT when the client needs the new ID
- Use `c.env.DB.batch([...stmts])` for multiple related inserts — never loop individual awaits
- Batch size limit is 100 statements per call; split with `stmts.slice(i, i + 100)` when needed
- Use subquery for auto-incrementing `sort_order` to avoid two-query race conditions:

```ts
// Single insert
const result = await c.env.DB.prepare(
  "INSERT INTO titles (title, year) VALUES (?, ?) RETURNING id"
).bind(body.title, body.year).first<{ id: number }>()

// Batch insert — use buildCastInsertStmts() from lib/cast.ts for cast_members
const stmts = items.map((item, i) =>
  c.env.DB.prepare("INSERT INTO foo (...) VALUES (?, ?, ?)").bind(...)
)
await c.env.DB.batch(stmts)

// sort_order via subquery (avoids MAX+1 race condition)
await c.env.DB.prepare(
  "INSERT INTO foo (name, sort_order) VALUES (?, COALESCE((SELECT MAX(sort_order)+1 FROM foo), 0)) RETURNING id"
).bind(name).first()
```

## Resource existence checks

Before inserting a child row, verify the parent exists and return 404 if not (prevents FK violations leaking as 500):

```ts
const parent = await c.env.DB.prepare("SELECT 1 FROM titles WHERE id = ?")
  .bind(id)
  .first()
if (!parent) return c.json({ error: "Not found" }, 404)
```

## Partial updates (PUT)

Use `COALESCE(?, column)` for NOT NULL fields that may be omitted from the request body.
For nullable fields that must support explicit null clearing, use direct assignment:

```ts
// Partial update: omit field → keep old value
"UPDATE foo SET name = COALESCE(?, name), year = COALESCE(?, year) WHERE id = ?"

// Nullable field: omit or null → clear; string → set
"UPDATE history SET display_name = ?, year = COALESCE(?, year) WHERE id = ?"
```

## Adding a new route module

Mount it in `src/server/index.ts`:

```ts
import { myRoutes } from "./routes/my"
app.route("/api/my", myRoutes)
```
