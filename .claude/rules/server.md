---
paths: ["src/server/**"]
---

# Server Conventions (Hono + Cloudflare D1 + Drizzle ORM)

## Auth middleware

- `authMiddleware` is required on all `POST` / `PATCH` / `DELETE` handlers
- `GET` handlers must NOT use `authMiddleware`

```ts
titlesRoutes.post("/", authMiddleware, async (c) => { ... })
titlesRoutes.get("/", async (c) => { ... })
```

## Path parameters

Always parse with `idParam` from `@shared/schemas/common` — never use bare `Number()`:

```ts
import { idParam } from "@shared/schemas/common"

const id = idParam.parse(c.req.param("id"))
```

`idParam` is `z.coerce.number().int().positive()`. It throws a `ZodError` (→ 400) on invalid input.

## Input validation

All `POST` and `PATCH` handlers must validate request bodies with zod. Derive schemas from `createInsertSchema` (drizzle-zod) to keep them in sync with the DB schema. Schemas shared between client and server live in `src/shared/schemas/`; server-only schemas stay in the route file.

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
- UNIQUE constraint violation → 409 via global `app.onError` (checks `err.message.includes("UNIQUE constraint failed")`)
- All other errors → 500 with `{ error: "Internal Server Error" }` (no internal details exposed)
- Do not add per-route try/catch for validation — let it bubble to `onError`

## Resource existence checks

Before PATCH or DELETE, verify the resource exists and return 404 if not:

```ts
const existing = await db.select({ id: titles.id }).from(titles).where(eq(titles.id, id)).get()
if (!existing) return c.json({ error: "Not found" }, 404)
```

Before inserting a child row, verify the parent exists and return 404:

```ts
const parent = await db.select({ id: titles.id }).from(titles).where(eq(titles.id, id)).get()
if (!parent) return c.json({ error: "Not found" }, 404)
```

## HTTP methods

- `POST` — create
- `PATCH` — partial update (omitted fields keep their current value)
- `PUT` — full replacement (used only for reorder endpoints that replace the entire ordered set)
- `DELETE` — delete

Never use `PUT` for partial updates. Use `PATCH` with existence check + COALESCE pattern.

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

// PATCH (partial update) — raw SQL with COALESCE for NOT NULL fields
await c.env.DB.prepare(
  "UPDATE titles SET title = COALESCE(?, title), updated_at = datetime('now') WHERE id = ?"
).bind(body.title ?? null, id).run()

// DELETE
await db.delete(titles).where(eq(titles.id, id))
```

### Batch operations

Use `db.batch()` for multiple related statements. Wrap chunks with `asBatch()` from `lib/batch.ts` to satisfy the non-empty tuple type. Use `batchAll()` to handle the 100-statement-per-call limit automatically:

```ts
import { asBatch, batchAll } from "../lib/batch"
import { buildCastInsertStmts } from "../lib/cast"

const stmts = buildCastInsertStmts(db, titleId, body.cast)
await batchAll(db, stmts)
```

### Bulk INSERT and the D1 parameter limit

D1 limits each prepared statement to **100 bound parameters**. For `INSERT ... VALUES (...)` with N bound columns, max rows per chunk = `floor(100 / N)`. Exceeding this throws `D1_ERROR: too many SQL variables`.

Use `Promise.all` to insert chunks concurrently; `flat()` preserves insertion order for subsequent `RETURNING` lookups:

```ts
// titles has 2 bound columns (title, year) → 50 rows per chunk
const CHUNK = Math.floor(100 / 2);
const chunks = Array.from({ length: Math.ceil(data.length / CHUNK) }, (_, i) =>
  data.slice(i * CHUNK, (i + 1) * CHUNK),
);
const inserted = (
  await Promise.all(
    chunks.map((chunk) => db.insert(table).values(chunk).returning({ id: table.id })),
  )
).flat();
```

> `batchAll` chunks *statements* (100 per `db.batch()` call) — a separate limit from the per-statement parameter count.

### sort_order via subquery

Use SQL subquery expression to avoid MAX+1 race conditions:

```ts
import { sql } from "drizzle-orm"

await db.insert(foos).values({
  name: body.name,
  sort_order: sql`COALESCE((SELECT MAX(sort_order)+1 FROM foos), 0)`,
}).returning({ id: foos.id })
```

### Partial updates (PATCH)

For NOT NULL fields that may be omitted, use raw SQL with `COALESCE`. For nullable fields, distinguish "key absent" (keep) from "key: null" (clear) by inspecting the raw body before zod parsing:

```ts
// NOT NULL partial update — keep COALESCE in raw SQL
await c.env.DB.prepare(
  "UPDATE titles SET title = COALESCE(?, title), updated_at = datetime('now') WHERE id = ?"
).bind(body.title ?? null, id).run()

// Nullable field: key present → set/clear; key absent → keep existing.
// Parse raw JSON first to detect key presence, then validate with zod.
const rawBody = await c.req.json<Record<string, unknown>>();
const body = myUpdateSchema.parse(rawBody);

if ("display_name" in rawBody) {
  await c.env.DB.prepare(
    "UPDATE history SET display_name = ?, year = COALESCE(?, year), updated_at = datetime('now') WHERE id = ?"
  ).bind(body.display_name ?? null, body.year ?? null, id).run()
} else {
  await c.env.DB.prepare(
    "UPDATE history SET year = COALESCE(?, year), updated_at = datetime('now') WHERE id = ?"
  ).bind(body.year ?? null, id).run()
}
```

## Row types

- **API response types** (shared with client): import from `src/shared/types.ts`
- **Server-internal types** (Hono Bindings, join results not exposed to client): import from `src/server/types.ts`

```ts
import type { Title, CastMember, HistoryEntry } from "@shared/types"
import type { Bindings } from "../types"
```

## Adding a new route module

1. Add schema to `src/server/db/schema.ts`
2. Add shared response types to `src/shared/types.ts`
3. Add server-internal types (Bindings, join results) to `src/server/types.ts` if needed
4. Create route file importing `getDb`, schema tables, `createInsertSchema`, and `idParam`
5. Mount in `src/server/index.ts`:

```ts
import { myRoutes } from "./routes/my";
app.route("/api/my", myRoutes);
```
