import { idParam } from "@shared/schemas/common";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "../db/client";
import { cast_members, titles } from "../db/schema";
import { castMemberInput } from "../lib/cast";
import { authMiddleware } from "../middleware/auth";
import type { Bindings } from "../types";

const updateCastInput = castMemberInput.partial();

export const castRoutes = new Hono<{ Bindings: Bindings }>();

castRoutes.get("/", async (c) => {
	const actor = (c.req.query("actor") ?? "").trim();
	if (!actor) {
		return c.json({ error: "actor query param required" }, 400);
	}

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

castRoutes.patch("/:id", authMiddleware, async (c) => {
	const id = idParam.parse(c.req.param("id"));
	const body = updateCastInput.parse(await c.req.json());
	const db = getDb(c.env.DB);

	const existing = await db
		.select({ id: cast_members.id })
		.from(cast_members)
		.where(eq(cast_members.id, id))
		.get();
	if (!existing) return c.json({ error: "Not found" }, 404);

	// COALESCE pattern keeps sql-level semantics; updated_at uses SQLite datetime()
	await c.env.DB.prepare(
		"UPDATE cast_members SET actor_name = COALESCE(?, actor_name), character_name = COALESCE(?, character_name), updated_at = datetime('now') WHERE id = ?",
	)
		.bind(body.actor_name ?? null, body.character_name ?? null, id)
		.run();
	return c.json({ ok: true });
});

castRoutes.delete("/:id", authMiddleware, async (c) => {
	const id = idParam.parse(c.req.param("id"));
	const db = getDb(c.env.DB);

	const existing = await db
		.select({ id: cast_members.id })
		.from(cast_members)
		.where(eq(cast_members.id, id))
		.get();
	if (!existing) return c.json({ error: "Not found" }, 404);

	await db.delete(cast_members).where(eq(cast_members.id, id));
	return c.json({ ok: true });
});
