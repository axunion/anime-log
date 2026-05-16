---
paths: ["src/server/**"]
---

# Server Conventions (Hono + Cloudflare D1 + Drizzle ORM)

## Auth middleware

- `authMiddleware` is required on all `POST` / `PUT` / `DELETE` handlers
- `GET` handlers must NOT use `authMiddleware`

```ts
titlesRoutes.post("/", authMiddleware, async (c) => { ... })
titlesRoutes.get("/", async (c) => { ... })
```

## Path parameters

Always parse with `Number()`:

```ts
const id = Number(c.req.param("id"))
```

## Input validation

All `POST` and `PUT` handlers must validate request bodies with zod. Derive schemas from `createInsertSchema` (drizzle-zod) to keep them in sync with the DB schema. Add `.min(1)` overrides for string fields, `.pick()` to restrict columns, and `.partial()` for update schemas.

```ts
import { z } from "zod"
import { createInsertSchema } from "drizzle-zod"
import { titles } from "../db/schema"

const createFoo = createInsertSchema(titles, {
  title: z.string().min(1),
}).pick({ title: true, year: true })

const updateFoo = createInsertSchema(titles, {
  title: z.string().min(1),
}).pick({ title: true, year: true }).partial()

fooRoutes.post("/", authMiddleware, async (c) => {
  const body = createFoo.parse(await c.req.json())
  // ...
})
```

Do NOT use `c.req.json<T>()` with a TypeScript type alone — this provides no runtime validation.

## Error handling

- `ZodError` → 400 via global `app.onError` in `index.ts`
- All other errors → 500 with `{ error: "Internal Server Error" }` (no internal details exposed)
- Do not add per-route try/catch for validation — let it bubble to `onError`

## Drizzle queries

Get a DB instance per-request via `getDb(c.env.DB)` from `src/server/db/client.ts`.

```ts
import { eq } from "drizzle-orm"
import { getDb } from "../db/client"
import { titles } from "../db/schema"

// SELECT
const db = getDb(c.env.DB)
const rows = await db.select({ id: titles.id, title: titles.title }).from(titles).orderBy(titles.title)

// INSERT with RETURNING
const [result] = await db.insert(titles).values({ title: body.title, year: body.year }).returning({ id: titles.id })

// UPDATE (simple)
await db.update(titles).set({ title: body.title }).where(eq(titles.id, id))

// DELETE
await db.delete(titles).where(eq(titles.id, id))
```

### Batch operations

Use `db.batch()` for multiple related statements. Wrap chunks with `asBatch()` from `lib/cast.ts` to satisfy the non-empty tuple type:

```ts
import { asBatch, buildCastInsertStmts } from "../lib/cast"

const stmts = buildCastInsertStmts(db, titleId, body.cast)
// D1 batch limit is 100 statements per call
for (let i = 0; i < stmts.length; i += 100) {
  await db.batch(asBatch(stmts.slice(i, i + 100)))
}
```

### sort_order via subquery

Use SQL subquery expression to avoid MAX+1 race conditions:

```ts
import { sql } from "drizzle-orm"

await db.insert(foos).values({
  name: body.name,
  sort_order: sql`COALESCE((SELECT MAX(sort_order)+1 FROM foos), 0)`,
}).returning({ id: foos.id })
```

### Partial updates (PUT)

For NOT NULL fields that may be omitted, use raw SQL with `COALESCE`. For nullable fields that must support explicit null clearing, bind the value directly:

```ts
// NOT NULL partial update — keep COALESCE in raw SQL
await c.env.DB.prepare(
  "UPDATE titles SET title = COALESCE(?, title), updated_at = datetime('now') WHERE id = ?"
).bind(body.title ?? null, id).run()

// Nullable field: omit or null → clear; string → set (Drizzle .set() handles this)
await db.update(history).set({ display_name: body.display_name ?? null }).where(eq(history.id, id))
```

## Resource existence checks

Before inserting a child row, verify the parent exists and return 404:

```ts
const parent = await db.select({ id: titles.id }).from(titles).where(eq(titles.id, id)).get()
if (!parent) return c.json({ error: "Not found" }, 404)
```

## Row types

Import canonical row types from `src/server/types.ts` rather than writing inline type annotations:

```ts
import type { Title, CastMember, HistoryEntry } from "../types"
```

## Adding a new route module

1. Add schema to `src/server/db/schema.ts`
2. Export row types from `src/server/types.ts`
3. Create route file importing `getDb`, schema tables, and `createInsertSchema`
4. Mount in `src/server/index.ts`:

```ts
import { myRoutes } from "./routes/my"
app.route("/api/my", myRoutes)
```
