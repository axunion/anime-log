import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import type { Bindings } from "../types";

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
	const body = await c.req.json<{
		title_id: number;
		display_name?: string;
		year: number;
	}>();

	const row = await c.env.DB.prepare(
		"SELECT MAX(sort_order) AS max_order FROM history",
	).first<{ max_order: number | null }>();
	const maxOrder = row?.max_order ?? -1;

	const result = await c.env.DB.prepare(
		"INSERT INTO history (title_id, display_name, year, sort_order) VALUES (?, ?, ?, ?) RETURNING id",
	)
		.bind(body.title_id, body.display_name ?? null, body.year, maxOrder + 1)
		.first();

	return c.json(result, 201);
});

historyRoutes.delete("/:id", authMiddleware, async (c) => {
	const id = Number(c.req.param("id"));
	await c.env.DB.prepare("DELETE FROM history WHERE id = ?").bind(id).run();
	return c.json({ ok: true });
});

historyRoutes.put("/reorder", authMiddleware, async (c) => {
	const body = await c.req.json<{ ids: number[] }>();
	const stmts = body.ids.map((id, i) =>
		c.env.DB.prepare("UPDATE history SET sort_order = ? WHERE id = ?").bind(
			i,
			id,
		),
	);
	await c.env.DB.batch(stmts);
	return c.json({ ok: true });
});
