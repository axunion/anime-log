import { Hono } from "hono";
import type { Bindings } from "../types";

type DataRow = {
	id: number;
	title: string;
	year: number;
	actor_name: string | null;
	character_name: string | null;
};

type HistoryRow = {
	title: string;
	display_name: string | null;
	year: number;
};

export const exportRoutes = new Hono<{ Bindings: Bindings }>();

exportRoutes.get("/data", async (c) => {
	const { results } = await c.env.DB.prepare(
		`SELECT t.id, t.title, t.year, c.actor_name, c.character_name
     FROM titles t
     LEFT JOIN cast_members c ON c.title_id = t.id
     ORDER BY t.id, c.sort_order`,
	).all<DataRow>();

	const map = new Map<
		number,
		{ title: string; year: number; cast: [string, string][] }
	>();
	for (const row of results) {
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
	const { results } = await c.env.DB.prepare(
		`SELECT t.title, h.display_name, h.year
     FROM history h
     JOIN titles t ON h.title_id = t.id
     ORDER BY h.sort_order`,
	).all<HistoryRow>();

	return c.json(
		results.map((r) =>
			r.display_name === null
				? { title: r.title, year: r.year }
				: { title: r.title, name: r.display_name, year: r.year },
		),
	);
});
