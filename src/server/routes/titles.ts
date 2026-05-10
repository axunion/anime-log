import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import type { Bindings } from "../types";

const castInput = z.object({
	actor_name: z.string().min(1),
	character_name: z.string().min(1),
});

const createTitle = z.object({
	title: z.string().min(1),
	year: z.number().int(),
	cast: z.array(castInput).optional(),
});

const updateTitle = z.object({
	title: z.string().min(1).optional(),
	year: z.number().int().optional(),
});

export const titlesRoutes = new Hono<{ Bindings: Bindings }>();

titlesRoutes.get("/", async (c) => {
	const { results } = await c.env.DB.prepare(
		"SELECT id, title, year FROM titles ORDER BY title",
	).all();
	return c.json(results);
});

titlesRoutes.get("/:id", async (c) => {
	const id = Number(c.req.param("id"));
	const title = await c.env.DB.prepare(
		"SELECT id, title, year FROM titles WHERE id = ?",
	)
		.bind(id)
		.first();
	if (!title) return c.json({ error: "Not found" }, 404);

	const { results: cast } = await c.env.DB.prepare(
		"SELECT id, actor_name, character_name FROM cast_members WHERE title_id = ? ORDER BY sort_order",
	)
		.bind(id)
		.all();

	return c.json({ ...title, cast });
});

titlesRoutes.post("/", authMiddleware, async (c) => {
	const body = createTitle.parse(await c.req.json());
	const result = await c.env.DB.prepare(
		"INSERT INTO titles (title, year) VALUES (?, ?) RETURNING id",
	)
		.bind(body.title, body.year)
		.first<{ id: number }>();

	if (!result) return c.json({ error: "Internal Server Error" }, 500);

	if (body.cast && body.cast.length > 0) {
		try {
			const stmts = body.cast.map((m, i) =>
				c.env.DB.prepare(
					"INSERT INTO cast_members (title_id, actor_name, character_name, sort_order) VALUES (?, ?, ?, ?)",
				).bind(result.id, m.actor_name, m.character_name, i),
			);
			await c.env.DB.batch(stmts);
		} catch (err) {
			// Compensate: delete the orphan title row if cast batch fails
			await c.env.DB.prepare("DELETE FROM titles WHERE id = ?")
				.bind(result.id)
				.run();
			throw err;
		}
	}

	return c.json(result, 201);
});

titlesRoutes.put("/:id", authMiddleware, async (c) => {
	const id = Number(c.req.param("id"));
	const body = updateTitle.parse(await c.req.json());
	await c.env.DB.prepare(
		"UPDATE titles SET title = COALESCE(?, title), year = COALESCE(?, year), updated_at = datetime('now') WHERE id = ?",
	)
		.bind(body.title ?? null, body.year ?? null, id)
		.run();
	return c.json({ ok: true });
});

titlesRoutes.delete("/:id", authMiddleware, async (c) => {
	const id = Number(c.req.param("id"));
	await c.env.DB.prepare("DELETE FROM titles WHERE id = ?").bind(id).run();
	return c.json({ ok: true });
});
