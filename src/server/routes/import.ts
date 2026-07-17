import {
  MAX_CAST_PER_TITLE,
  MAX_IMPORT_ROWS,
  MAX_NAME_LENGTH,
} from "@shared/schemas/common";
import type { BatchItem } from "drizzle-orm/batch";
import { createInsertSchema } from "drizzle-zod";
import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db/client";
import { history, titles } from "../db/schema";
import { asDeleteBatch, batchAll } from "../lib/batch";
import { buildCastInsertStmts } from "../lib/cast";
import { authMiddleware } from "../middleware/auth";
import type { Bindings } from "../types";

export const importRoutes = new Hono<{ Bindings: Bindings }>();

const importName = z.string().min(1).max(MAX_NAME_LENGTH);

const importDataItem = createInsertSchema(titles, {
  title: importName,
  year: z.coerce.number().int().min(1900).max(2100),
})
  .pick({ title: true, year: true })
  .extend({
    cast: z
      .array(z.tuple([importName, importName]))
      .max(MAX_CAST_PER_TITLE)
      .default([]),
  });
const importDataSchema = z.array(importDataItem).max(MAX_IMPORT_ROWS);

const importHistoryItem = createInsertSchema(history, {
  year: z.coerce.number().int().min(1900).max(2100),
})
  .pick({ year: true })
  .extend({
    title: importName,
    name: importName.optional(),
  });
const importHistorySchema = z.array(importHistoryItem).max(MAX_IMPORT_ROWS);

importRoutes.post("/data", authMiddleware, async (c) => {
  if (c.req.query("confirm") !== "replace-all") {
    return c.json(
      { error: "Missing confirmation: add ?confirm=replace-all" },
      400,
    );
  }
  const body = importDataSchema.parse(await c.req.json());

  // Detect duplicate titles before any destructive operation.
  const titleSet = new Set(body.map((e) => e.title));
  if (titleSet.size !== body.length) {
    return c.json({ error: "Duplicate titles in payload" }, 400);
  }

  const db = getDb(c.env.DB);

  // D1 limits bound parameters to 100 per statement; titles has 2 columns → max 50 rows per chunk.
  const TITLE_CHUNK = 50;
  const chunks = Array.from(
    { length: Math.ceil(body.length / TITLE_CHUNK) },
    (_, i) => body.slice(i * TITLE_CHUNK, (i + 1) * TITLE_CHUNK),
  );

  // Atomic batch: delete all titles (cascades to cast + history) then insert the new set.
  // batchAll places the delete in the first db.batch() call so no failure leaves the DB empty.
  // For payloads up to ~4950 titles the delete and all inserts land in a single atomic call.
  const titleInsertStmts = chunks.map((chunk) =>
    db
      .insert(titles)
      .values(chunk.map((e) => ({ title: e.title, year: e.year }))),
  ) as BatchItem<"sqlite">[];
  await batchAll(db, [asDeleteBatch(db.delete(titles)), ...titleInsertStmts]);

  if (body.length === 0) return c.json({ imported: 0 });

  // Re-fetch inserted IDs keyed by title name — avoids positional RETURNING assumptions.
  const insertedTitles = await db
    .select({ id: titles.id, title: titles.title })
    .from(titles);
  const titleMap = new Map(insertedTitles.map((t) => [t.title, t.id]));

  const castStmts = body.flatMap((entry) =>
    buildCastInsertStmts(
      db,
      // biome-ignore lint/style/noNonNullAssertion: guaranteed non-null by the batch insert above
      titleMap.get(entry.title)!,
      entry.cast.map(([actor_name, character_name]) => ({
        actor_name,
        character_name,
      })),
    ),
  );

  if (castStmts.length > 0) {
    await batchAll(db, castStmts);
  }

  return c.json({ imported: body.length });
});

importRoutes.post("/history", authMiddleware, async (c) => {
  if (c.req.query("confirm") !== "replace-all") {
    return c.json(
      { error: "Missing confirmation: add ?confirm=replace-all" },
      400,
    );
  }
  const body = importHistorySchema.parse(await c.req.json());
  const db = getDb(c.env.DB);

  const allTitles = await db
    .select({ id: titles.id, title: titles.title })
    .from(titles);
  const titleMap = new Map(allTitles.map((t) => [t.title, t.id]));

  const orphan = body.find((e) => !titleMap.has(e.title));
  if (orphan) {
    return c.json({ error: "Unknown title", title: orphan.title }, 400);
  }

  // Atomic batch: delete old history then insert new entries.
  // batchAll places the delete in the first db.batch() call so no failure leaves history empty.
  const insertStmts = body.map((e, i) =>
    db.insert(history).values({
      // biome-ignore lint/style/noNonNullAssertion: guaranteed non-null by orphan check above
      title_id: titleMap.get(e.title)!,
      display_name: e.name ?? null,
      year: e.year,
      sort_order: i,
    }),
  ) as BatchItem<"sqlite">[];
  await batchAll(db, [asDeleteBatch(db.delete(history)), ...insertStmts]);

  return c.json({ imported: body.length });
});
