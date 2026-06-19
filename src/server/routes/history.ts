import { idParam } from "@shared/schemas/common";
import { eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { createInsertSchema } from "drizzle-zod";
import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db/client";
import { history, titles } from "../db/schema";
import { batchAll } from "../lib/cast";
import { authMiddleware } from "../middleware/auth";
import type { Bindings } from "../types";

const createHistory = createInsertSchema(history).pick({
  title_id: true,
  display_name: true,
  year: true,
});

const reorderHistory = z.object({
  ids: z.array(z.number().int().positive()),
});

const updateHistory = createInsertSchema(history)
  .pick({ display_name: true, year: true })
  .partial();

export const historyRoutes = new Hono<{ Bindings: Bindings }>();

historyRoutes.get("/", async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db
    .select({
      id: history.id,
      display_name: history.display_name,
      year: history.year,
      sort_order: history.sort_order,
      title_id: titles.id,
      title: titles.title,
    })
    .from(history)
    .innerJoin(titles, eq(history.title_id, titles.id))
    .orderBy(history.sort_order);
  return c.json(rows);
});

historyRoutes.post("/", authMiddleware, async (c) => {
  const body = createHistory.parse(await c.req.json());
  const db = getDb(c.env.DB);

  // sort_order via subquery avoids MAX+1 race condition
  const [result] = await db
    .insert(history)
    .values({
      title_id: body.title_id,
      display_name: body.display_name ?? null,
      year: body.year,
      sort_order: sql`COALESCE((SELECT MAX(sort_order)+1 FROM history), 0)`,
    })
    .returning({ id: history.id });

  return c.json(result, 201);
});

historyRoutes.delete("/:id", authMiddleware, async (c) => {
  const id = idParam.parse(c.req.param("id"));
  const db = getDb(c.env.DB);

  const existing = await db
    .select({ id: history.id })
    .from(history)
    .where(eq(history.id, id))
    .get();
  if (!existing) return c.json({ error: "Not found" }, 404);

  await db.delete(history).where(eq(history.id, id));
  return c.json({ ok: true });
});

historyRoutes.put("/reorder", authMiddleware, async (c) => {
  const body = reorderHistory.parse(await c.req.json());
  const db = getDb(c.env.DB);
  const stmts: BatchItem<"sqlite">[] = body.ids.map(
    (id, i) =>
      db
        .update(history)
        .set({ sort_order: i })
        .where(eq(history.id, id)) as BatchItem<"sqlite">,
  );
  await batchAll(db, stmts);
  return c.json({ ok: true });
});

historyRoutes.patch("/:id", authMiddleware, async (c) => {
  const id = idParam.parse(c.req.param("id"));
  // Parse raw body first to distinguish "key absent" (keep) from "key: null" (clear).
  const rawBody = await c.req.json<Record<string, unknown>>();
  const body = updateHistory.parse(rawBody);
  const db = getDb(c.env.DB);

  const existing = await db
    .select({ id: history.id })
    .from(history)
    .where(eq(history.id, id))
    .get();
  if (!existing) return c.json({ error: "Not found" }, 404);

  // display_name: key present → set or clear (null); key absent → keep existing value.
  // year: COALESCE keeps existing value when omitted.
  if ("display_name" in rawBody) {
    await c.env.DB.prepare(
      "UPDATE history SET display_name = ?, year = COALESCE(?, year), updated_at = datetime('now') WHERE id = ?",
    )
      .bind(body.display_name ?? null, body.year ?? null, id)
      .run();
  } else {
    await c.env.DB.prepare(
      "UPDATE history SET year = COALESCE(?, year), updated_at = datetime('now') WHERE id = ?",
    )
      .bind(body.year ?? null, id)
      .run();
  }
  return c.json({ ok: true });
});
