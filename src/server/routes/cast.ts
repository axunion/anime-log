import { eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db/client";
import { cast_members, titles } from "../db/schema";
import { batchAll, buildCastInsertStmts, castMemberInput } from "../lib/cast";
import { authMiddleware } from "../middleware/auth";
import type { Bindings } from "../types";

const castListInput = z.object({
	cast: z.array(castMemberInput),
});

const updateCastInput = castMemberInput.partial();

export const castRoutes = new Hono<{ Bindings: Bindings }>();

castRoutes.get("/cast", async (c) => {
	const actor = c.req.query("actor");
	if (!actor) return c.json({ error: "actor query param required" }, 400);

	const db = getDb(c.env.DB);
	const rows = await db
		.select({
			id: cast_members.id,
			character_name: cast_members.character_name,
			title_id: titles.id,
			title: titles.title,
			year: titles.year,
		})
		.from(cast_members)
		.innerJoin(titles, eq(cast_members.title_id, titles.id))
		.where(eq(cast_members.actor_name, actor))
		.orderBy(titles.title);
	return c.json(rows);
});

castRoutes.post("/titles/:id/cast", authMiddleware, async (c) => {
	const titleId = Number(c.req.param("id"));
	const body = castMemberInput.parse(await c.req.json());
	const db = getDb(c.env.DB);

	const title = await db
		.select({ id: titles.id })
		.from(titles)
		.where(eq(titles.id, titleId))
		.get();
	if (!title) return c.json({ error: "Not found" }, 404);

	// sort_order via subquery avoids MAX+1 race condition
	const [result] = await db
		.insert(cast_members)
		.values({
			title_id: titleId,
			actor_name: body.actor_name,
			character_name: body.character_name,
			sort_order: sql`COALESCE((SELECT MAX(sort_order)+1 FROM cast_members WHERE title_id = ${titleId}), 0)`,
		})
		.returning({ id: cast_members.id });

	return c.json(result, 201);
});

castRoutes.put("/titles/:id/cast", authMiddleware, async (c) => {
	const titleId = Number(c.req.param("id"));
	const body = castListInput.parse(await c.req.json());
	const db = getDb(c.env.DB);

	const title = await db
		.select({ id: titles.id })
		.from(titles)
		.where(eq(titles.id, titleId))
		.get();
	if (!title) return c.json({ error: "Not found" }, 404);

	const deleteStmt = db
		.delete(cast_members)
		.where(eq(cast_members.title_id, titleId));
	const insertStmts = buildCastInsertStmts(db, titleId, body.cast);
	const allStmts: BatchItem<"sqlite">[] = [
		deleteStmt as BatchItem<"sqlite">,
		...insertStmts,
	];
	await batchAll(db, allStmts);
	return c.json({ ok: true });
});

castRoutes.put("/cast/:id", authMiddleware, async (c) => {
	const id = Number(c.req.param("id"));
	const body = updateCastInput.parse(await c.req.json());
	// COALESCE pattern keeps sql-level semantics; updated_at uses SQLite datetime()
	await c.env.DB.prepare(
		"UPDATE cast_members SET actor_name = COALESCE(?, actor_name), character_name = COALESCE(?, character_name), updated_at = datetime('now') WHERE id = ?",
	)
		.bind(body.actor_name ?? null, body.character_name ?? null, id)
		.run();
	return c.json({ ok: true });
});

castRoutes.delete("/cast/:id", authMiddleware, async (c) => {
	const id = Number(c.req.param("id"));
	const db = getDb(c.env.DB);
	await db.delete(cast_members).where(eq(cast_members.id, id));
	return c.json({ ok: true });
});
