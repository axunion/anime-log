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

## D1 queries

- Use `RETURNING id` on INSERT when the client needs the new ID
- Use `c.env.DB.batch([...stmts])` for multiple related inserts — never loop individual awaits

```ts
// Single insert
const result = await c.env.DB.prepare(
  "INSERT INTO titles (title, year) VALUES (?, ?) RETURNING id"
).bind(body.title, body.year).first<{ id: number }>()

// Batch insert
const stmts = items.map((item, i) =>
  c.env.DB.prepare("INSERT INTO cast_members (...) VALUES (?, ?, ?)").bind(...)
)
await c.env.DB.batch(stmts)
```

## Adding a new route module

Mount it in `src/server/index.ts`:

```ts
import { myRoutes } from "./routes/my"
app.route("/api/my", myRoutes)
```
