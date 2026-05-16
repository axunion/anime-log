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
The project uses **Cloudflare Workers + D1 + Hono**.
Coding conventions are defined in `.claude/rules/server.md` — follow them exactly.

## Layer 2: Hono Route Module

Create `src/server/routes/<name>.ts` following this template:

```typescript
import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import type { Bindings } from "../types";

const createMyItem = z.object({
  some_text: z.string().min(1),
});

const updateMyItem = z.object({
  some_text: z.string().min(1).optional(),
});

export const myRoutes = new Hono<{ Bindings: Bindings }>();

myRoutes.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, some_text FROM my_table ORDER BY sort_order"
  ).all();
  return c.json(results);
});

myRoutes.post("/", authMiddleware, async (c) => {
  const body = createMyItem.parse(await c.req.json());
  const result = await c.env.DB.prepare(
    "INSERT INTO my_table (some_text) VALUES (?) RETURNING id"
  ).bind(body.some_text).first<{ id: number }>();
  return c.json(result, 201);
});

myRoutes.put("/:id", authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  const body = updateMyItem.parse(await c.req.json());
  await c.env.DB.prepare(
    "UPDATE my_table SET some_text = COALESCE(?, some_text) WHERE id = ?"
  ).bind(body.some_text ?? null, id).run();
  return c.json({ ok: true });
});

myRoutes.delete("/:id", authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  await c.env.DB.prepare("DELETE FROM my_table WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});
```

**Zod schemas must be defined at the top of the file.** `ZodError` is caught globally in `index.ts` and returned as `400 Bad Request` — do not add per-route try/catch. Never use `c.req.json<T>()` with a TypeScript type alone; it provides no runtime validation.

**Mount in `src/server/index.ts`:**
```typescript
import { myRoutes } from "./routes/my";
// ...
app.route("/api/my", myRoutes);
```

---

## Layer 3: TypeScript Types

Add to `src/client/lib/types.ts`:

```typescript
export type MyItem = {
  id: number;
  some_text: string;
  sort_order: number;
};
```

Keep types minimal — only include fields the client actually uses. Don't mirror the full DB schema.

---

## Checklist

- [ ] Route file created in `src/server/routes/`
- [ ] Route mounted in `src/server/index.ts`
- [ ] Write endpoints all use `authMiddleware`
- [ ] Types added to `src/client/lib/types.ts`
- [ ] Test with `pnpm dev` (check worker logs in the terminal)

**Next step:** Add the Vue composable and component with the `client-feature` skill.
