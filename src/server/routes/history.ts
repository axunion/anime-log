import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import type { Bindings } from "../types";

const createHistory = z.object({
	title_id: z.number().int(),
	display_name: z.string().optional(),
	year: z.number().int(),
});

const reorderHistory = z.object({
	ids: z.array(z.number().int()),
});

const updateHistory = z.object({
	display_name: z.string().nullable().optional(),
	year: z.number().int().optional(),
});

export const historyRoutes = new Hono<{ Bindings: Bindings }>();

historyRoutes.get("/", async (c) => {
	const { results } = await c.env.DB.prepare(
		`SELECT h.id, h.display_name, h.year, h.sort_order, t.id AS title_id, t.title
     FROM history h
     JOIN titles t ON h.title_id = t.id
     ORDER BY h.sort_order`,
	).all();
	return c.json(results);
});

historyRoutes.post("/", authMiddleware, async (c) => {
	const body = createHistory.parse(await c.req.json());

	const result = await c.env.DB.prepare(
		`INSERT INTO history (title_id, display_name, year, sort_order)
     VALUES (?, ?, ?, COALESCE((SELECT MAX(sort_order)+1 FROM history), 0))
     RETURNING id`,
	)
		.bind(body.title_id, body.display_name ?? null, body.year)
		.first();

	return c.json(result, 201);
});

historyRoutes.delete("/:id", authMiddleware, async (c) => {
	const id = Number(c.req.param("id"));
	await c.env.DB.prepare("DELETE FROM history WHERE id = ?").bind(id).run();
	return c.json({ ok: true });
});

historyRoutes.put("/reorder", authMiddleware, async (c) => {
	const body = reorderHistory.parse(await c.req.json());
	const stmts = body.ids.map((id, i) =>
		c.env.DB.prepare("UPDATE history SET sort_order = ? WHERE id = ?").bind(
			i,
			id,
		),
	);
	// D1 batch limit is 100 statements per call
	for (let i = 0; i < stmts.length; i += 100) {
		await c.env.DB.batch(stmts.slice(i, i + 100));
	}
	return c.json({ ok: true });
});

historyRoutes.put("/:id", authMiddleware, async (c) => {
	const id = Number(c.req.param("id"));
	const body = updateHistory.parse(await c.req.json());
	await c.env.DB.prepare(
		"UPDATE history SET display_name = ?, year = COALESCE(?, year), updated_at = datetime('now') WHERE id = ?",
	)
		.bind(body.display_name ?? null, body.year ?? null, id)
		.run();
	return c.json({ ok: true });
});
