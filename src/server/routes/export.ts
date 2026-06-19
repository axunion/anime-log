import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "../db/client";
import { cast_members, history, titles } from "../db/schema";
import type { Bindings } from "../types";

export const exportRoutes = new Hono<{ Bindings: Bindings }>();

exportRoutes.get("/data", async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db
    .select({
      id: titles.id,
      title: titles.title,
      year: titles.year,
      actor_name: cast_members.actor_name,
      character_name: cast_members.character_name,
    })
    .from(titles)
    .leftJoin(cast_members, eq(cast_members.title_id, titles.id))
    .orderBy(asc(titles.id), asc(cast_members.sort_order));

  const map = new Map<
    number,
    { title: string; year: number; cast: [string, string][] }
  >();
  for (const row of rows) {
    let entry = map.get(row.id);
    if (!entry) {
      entry = { title: row.title, year: row.year, cast: [] };
      map.set(row.id, entry);
    }
    if (row.actor_name !== null && row.character_name !== null) {
      entry.cast.push([row.actor_name, row.character_name]);
    }
  }

  return c.json([...map.values()]);
});

exportRoutes.get("/history", async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db
    .select({
      title: titles.title,
      display_name: history.display_name,
      year: history.year,
    })
    .from(history)
    .innerJoin(titles, eq(history.title_id, titles.id))
    .orderBy(asc(history.sort_order));

  return c.json(
    rows.map((r) =>
      r.display_name === null
        ? { title: r.title, year: r.year }
        : { title: r.title, name: r.display_name, year: r.year },
    ),
  );
});
