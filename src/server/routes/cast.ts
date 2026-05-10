import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import type { Bindings } from "../types";

const castMemberInput = z.object({
	actor_name: z.string().min(1),
	character_name: z.string().min(1),
});

const castListInput = z.object({
	cast: z.array(castMemberInput),
});

const updateCastInput = z.object({
	actor_name: z.string().min(1).optional(),
	character_name: z.string().min(1).optional(),
});

export const castRoutes = new Hono<{ Bindings: Bindings }>();

castRoutes.get("/cast", async (c) => {
	const actor = c.req.query("actor");
	if (!actor) return c.json({ error: "actor query param required" }, 400);

	const { results } = await c.env.DB.prepare(
		`SELECT cm.id, cm.character_name, t.id AS title_id, t.title, t.year
     FROM cast_members cm
     JOIN titles t ON cm.title_id = t.id
     WHERE cm.actor_name = ?
     ORDER BY t.title`,
	)
		.bind(actor)
		.all();
	return c.json(results);
});

castRoutes.post("/titles/:id/cast", authMiddleware, async (c) => {
	const titleId = Number(c.req.param("id"));
	const body = castMemberInput.parse(await c.req.json());

	const result = await c.env.DB.prepare(
		`INSERT INTO cast_members (title_id, actor_name, character_name, sort_order)
     VALUES (?, ?, ?, COALESCE((SELECT MAX(sort_order)+1 FROM cast_members WHERE title_id = ?), 0))
     RETURNING id`,
	)
		.bind(titleId, body.actor_name, body.character_name, titleId)
		.first();

	return c.json(result, 201);
});

castRoutes.put("/titles/:id/cast", authMiddleware, async (c) => {
	const titleId = Number(c.req.param("id"));
	const body = castListInput.parse(await c.req.json());
	const stmts = [
		c.env.DB.prepare("DELETE FROM cast_members WHERE title_id = ?").bind(
			titleId,
		),
		...body.cast.map((m, i) =>
			c.env.DB.prepare(
				"INSERT INTO cast_members (title_id, actor_name, character_name, sort_order) VALUES (?, ?, ?, ?)",
			).bind(titleId, m.actor_name, m.character_name, i),
		),
	];
	// D1 batch limit is 100 statements per call
	for (let i = 0; i < stmts.length; i += 100) {
		await c.env.DB.batch(stmts.slice(i, i + 100));
	}
	return c.json({ ok: true });
});

castRoutes.put("/cast/:id", authMiddleware, async (c) => {
	const id = Number(c.req.param("id"));
	const body = updateCastInput.parse(await c.req.json());
	await c.env.DB.prepare(
		"UPDATE cast_members SET actor_name = COALESCE(?, actor_name), character_name = COALESCE(?, character_name) WHERE id = ?",
	)
		.bind(body.actor_name ?? null, body.character_name ?? null, id)
		.run();
	return c.json({ ok: true });
});

castRoutes.delete("/cast/:id", authMiddleware, async (c) => {
	const id = Number(c.req.param("id"));
	await c.env.DB.prepare("DELETE FROM cast_members WHERE id = ?")
		.bind(id)
		.run();
	return c.json({ ok: true });
});
