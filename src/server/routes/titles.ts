import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db/client";
import { cast_members, titles } from "../db/schema";
import { batchAll, buildCastInsertStmts, castMemberInput } from "../lib/cast";
import { authMiddleware } from "../middleware/auth";
import type { Bindings } from "../types";

const createTitle = createInsertSchema(titles, {
	title: z.string().min(1),
})
	.pick({ title: true, year: true })
	.extend({
		cast: z.array(castMemberInput).optional(),
	});

const updateTitle = createInsertSchema(titles, {
	title: z.string().min(1),
})
	.pick({ title: true, year: true })
	.partial();

export const titlesRoutes = new Hono<{ Bindings: Bindings }>();

titlesRoutes.get("/", async (c) => {
	const db = getDb(c.env.DB);
	const rows = await db
		.select({ id: titles.id, title: titles.title, year: titles.year })
		.from(titles)
		.orderBy(titles.title);
	return c.json(rows);
});

titlesRoutes.get("/:id", async (c) => {
	const id = Number(c.req.param("id"));
	const db = getDb(c.env.DB);

	const title = await db
		.select({ id: titles.id, title: titles.title, year: titles.year })
		.from(titles)
		.where(eq(titles.id, id))
		.get();
	if (!title) return c.json({ error: "Not found" }, 404);

	const cast = await db
		.select({
			id: cast_members.id,
			actor_name: cast_members.actor_name,
			character_name: cast_members.character_name,
		})
		.from(cast_members)
		.where(eq(cast_members.title_id, id))
		.orderBy(cast_members.sort_order);

	return c.json({ ...title, cast });
});

titlesRoutes.post("/", authMiddleware, async (c) => {
	const body = createTitle.parse(await c.req.json());
	const db = getDb(c.env.DB);

	const [titleResult] = await db
		.insert(titles)
		.values({ title: body.title, year: body.year })
		.returning({ id: titles.id });

	if (!titleResult) return c.json({ error: "Internal Server Error" }, 500);

	if (body.cast && body.cast.length > 0) {
		const castStmts = buildCastInsertStmts(db, titleResult.id, body.cast);
		try {
			await batchAll(db, castStmts);
		} catch (err) {
			// Compensate: delete the orphan title row if cast batch fails
			await db.delete(titles).where(eq(titles.id, titleResult.id));
			throw err;
		}
	}

	return c.json({ id: titleResult.id }, 201);
});

titlesRoutes.put("/:id", authMiddleware, async (c) => {
	const id = Number(c.req.param("id"));
	const body = updateTitle.parse(await c.req.json());
	// COALESCE pattern keeps sql-level semantics; updated_at uses SQLite datetime()
	await c.env.DB.prepare(
		"UPDATE titles SET title = COALESCE(?, title), year = COALESCE(?, year), updated_at = datetime('now') WHERE id = ?",
	)
		.bind(body.title ?? null, body.year ?? null, id)
		.run();
	return c.json({ ok: true });
});

titlesRoutes.delete("/:id", authMiddleware, async (c) => {
	const id = Number(c.req.param("id"));
	const db = getDb(c.env.DB);
	await db.delete(titles).where(eq(titles.id, id));
	return c.json({ ok: true });
});
