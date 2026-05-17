import type { BatchItem } from "drizzle-orm/batch";
import { createInsertSchema } from "drizzle-zod";
import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db/client";
import { history, titles } from "../db/schema";
import { batchAll, buildCastInsertStmts } from "../lib/cast";
import { authMiddleware } from "../middleware/auth";
import type { Bindings } from "../types";

export const importRoutes = new Hono<{ Bindings: Bindings }>();

const importDataItem = createInsertSchema(titles, {
	title: z.string().min(1),
})
	.pick({ title: true, year: true })
	.extend({
		cast: z.array(z.tuple([z.string().min(1), z.string().min(1)])).default([]),
	});
const importDataSchema = z.array(importDataItem);

const importHistoryItem = createInsertSchema(history)
	.pick({ year: true })
	.extend({
		title: z.string().min(1),
		name: z.string().min(1).optional(),
	});
const importHistorySchema = z.array(importHistoryItem);

importRoutes.post("/data", authMiddleware, async (c) => {
	const body = importDataSchema.parse(await c.req.json());
	const db = getDb(c.env.DB);

	await db.delete(titles);

	if (body.length === 0) return c.json({ imported: 0 });

	const inserted = await db
		.insert(titles)
		.values(body.map((e) => ({ title: e.title, year: e.year })))
		.returning({ id: titles.id });

	const castStmts = body.flatMap((entry, i) =>
		buildCastInsertStmts(
			db,
			inserted[i].id,
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

	await db.delete(history);

	if (body.length > 0) {
		const stmts = body.map((e, i) =>
			db.insert(history).values({
				title_id: titleMap.get(e.title)!,
				display_name: e.name ?? null,
				year: e.year,
				sort_order: i,
			}),
		) as BatchItem<"sqlite">[];
		await batchAll(db, stmts);
	}

	return c.json({ imported: body.length });
});
