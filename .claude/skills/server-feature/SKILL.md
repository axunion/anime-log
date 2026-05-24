---
name: server-feature
description: >
  Add a new Hono API route and TypeScript types to the anime-log server. Use this skill when
  the user says "add an API route", "add an endpoint", "implement the server side", "create a
  route for [X]", or when a new feature needs backend implementation. Also triggered as part of
  the full-stack anime-log-feature workflow (after the migrate skill).
---

# Server Feature — Hono Route + TypeScript Types

This covers Layer 2 (Hono route) and Layer 3 (TypeScript types) of the anime-log stack.
The project uses **Cloudflare Workers + D1 + Hono + Drizzle ORM**.
Coding conventions are defined in `.claude/rules/server.md` — follow them exactly.

## Layer 2: Hono Route Module

Create `src/server/routes/<name>.ts` following this template:

```typescript
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { Hono } from "hono";
import { z } from "zod";
import { idParam } from "@shared/schemas/common";
import { getDb } from "../db/client";
import { my_table } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import type { Bindings } from "../types";

const createMyItem = createInsertSchema(my_table, {
  some_text: z.string().min(1),
}).pick({ some_text: true });

const updateMyItem = createInsertSchema(my_table, {
  some_text: z.string().min(1),
}).pick({ some_text: true }).partial();

export const myRoutes = new Hono<{ Bindings: Bindings }>();

myRoutes.get("/", async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db
    .select({ id: my_table.id, some_text: my_table.some_text })
    .from(my_table)
    .orderBy(my_table.sort_order);
  return c.json(rows);
});

myRoutes.post("/", authMiddleware, async (c) => {
  const body = createMyItem.parse(await c.req.json());
  const db = getDb(c.env.DB);
  const [result] = await db
    .insert(my_table)
    .values({ some_text: body.some_text })
    .returning({ id: my_table.id });
  return c.json(result, 201);
});

myRoutes.patch("/:id", authMiddleware, async (c) => {
  const id = idParam.parse(c.req.param("id"));
  const body = updateMyItem.parse(await c.req.json());
  const db = getDb(c.env.DB);
  const existing = await db.select({ id: my_table.id }).from(my_table).where(eq(my_table.id, id)).get();
  if (!existing) return c.json({ error: "Not found" }, 404);
  // COALESCE keeps NOT NULL fields unchanged when omitted
  await c.env.DB.prepare(
    "UPDATE my_table SET some_text = COALESCE(?, some_text), updated_at = datetime('now') WHERE id = ?"
  ).bind(body.some_text ?? null, id).run();
  return c.json({ ok: true });
});

myRoutes.delete("/:id", authMiddleware, async (c) => {
  const id = idParam.parse(c.req.param("id"));
  const db = getDb(c.env.DB);
  const existing = await db.select({ id: my_table.id }).from(my_table).where(eq(my_table.id, id)).get();
  if (!existing) return c.json({ error: "Not found" }, 404);
  await db.delete(my_table).where(eq(my_table.id, id));
  return c.json({ ok: true });
});
```

**Mount in `src/server/index.ts`:**
```typescript
import { myRoutes } from "./routes/my";
// ...
app.route("/api/my", myRoutes);
```

---

## Layer 3: TypeScript Types

### Shared response types (client + server)

Add to `src/shared/types.ts`. Keep them minimal — only include fields the client actually uses:

```typescript
export type MyItem = {
  id: number;
  some_text: string;
};
```

### Server-internal types

Add to `src/server/types.ts` only if needed for server-only join results or Hono Bindings:

```typescript
import type { InferSelectModel } from "drizzle-orm";
import type { my_table } from "./db/schema";

export type MyRow = InferSelectModel<typeof my_table>;
```

Do **not** add types to `src/client/lib/types.ts` — that file no longer exists. All API response types go in `src/shared/types.ts`.

---

## Checklist

- [ ] Route file created in `src/server/routes/`
- [ ] Route mounted in `src/server/index.ts`
- [ ] Write endpoints all use `authMiddleware`
- [ ] Path params parsed with `idParam.parse()` (not `Number()`)
- [ ] PATCH and DELETE handlers check existence → 404 before acting
- [ ] Shared response types added to `src/shared/types.ts`
- [ ] Server-only types added to `src/server/types.ts` (if needed)
- [ ] Test with `pnpm dev` (check worker logs in the terminal)
- [ ] For bulk INSERT: chunk at `floor(100 / bound_columns)` rows (D1 parameter limit — see `rules/server.md`)

**Next step:** Add the Vue composable and component with the `client-feature` skill.
