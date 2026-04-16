import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import type { Bindings } from "../types";

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
	const body = await c.req.json<{
		actor_name: string;
		character_name: string;
	}>();

	const row = await c.env.DB.prepare(
		"SELECT MAX(sort_order) AS max_order FROM cast_members WHERE title_id = ?",
	)
		.bind(titleId)
		.first<{ max_order: number | null }>();
	const maxOrder = row?.max_order ?? -1;

	const result = await c.env.DB.prepare(
		"INSERT INTO cast_members (title_id, actor_name, character_name, sort_order) VALUES (?, ?, ?, ?) RETURNING id",
	)
		.bind(titleId, body.actor_name, body.character_name, maxOrder + 1)
		.first();

	return c.json(result, 201);
});

castRoutes.put("/titles/:id/cast", authMiddleware, async (c) => {
	const titleId = Number(c.req.param("id"));
	const body = await c.req.json<{
		cast: { actor_name: string; character_name: string }[];
	}>();
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
	await c.env.DB.batch(stmts);
	return c.json({ ok: true });
});

castRoutes.put("/cast/:id", authMiddleware, async (c) => {
	const id = Number(c.req.param("id"));
	const body = await c.req.json<{
		actor_name?: string;
		character_name?: string;
	}>();
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
