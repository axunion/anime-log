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

myRoutes.put("/:id", authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  const body = updateMyItem.parse(await c.req.json());
  // COALESCE pattern keeps sql-level semantics; updated_at uses SQLite datetime()
  await c.env.DB.prepare(
    "UPDATE my_table SET some_text = COALESCE(?, some_text), updated_at = datetime('now') WHERE id = ?"
  ).bind(body.some_text ?? null, id).run();
  return c.json({ ok: true });
});

myRoutes.delete("/:id", authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  const db = getDb(c.env.DB);
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

### Server-side (row types)

Add to `src/server/types.ts` via `InferSelectModel`:

```typescript
import type { InferSelectModel } from "drizzle-orm";
import type { my_table } from "./db/schema";

export type MyRow = InferSelectModel<typeof my_table>;
```

### Client-side (API response types)

Add to `src/client/lib/types.ts`:

```typescript
export type MyItem = {
  id: number;
  some_text: string;
  sort_order: number;
};
```

Keep client types minimal — only include fields the client actually uses.

---

## Checklist

- [ ] Route file created in `src/server/routes/`
- [ ] Route mounted in `src/server/index.ts`
- [ ] Write endpoints all use `authMiddleware`
- [ ] Server row type added to `src/server/types.ts`
- [ ] Client type added to `src/client/lib/types.ts`
- [ ] Test with `pnpm dev` (check worker logs in the terminal)

**Next step:** Add the Vue composable and component with the `client-feature` skill.
