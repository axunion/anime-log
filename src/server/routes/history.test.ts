/// <reference types="@cloudflare/vitest-pool-workers/types" />
import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import {
	applySchema,
	seedTitle,
	seedHistory,
} from "../../../test/helpers/d1.ts";
import { callApp } from "../../../test/helpers/app.ts";
import type { Bindings } from "../types.ts";

const typedEnv = env as unknown as Bindings;

describe("GET /api/history", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("returns history entries sorted by sort_order", async () => {
		const id = await seedTitle(typedEnv.DB, { title: "OP", year: 1999 });
		await seedHistory(typedEnv.DB, [
			{ title_id: id, year: 2020 },
			{ title_id: id, year: 2021 },
			{ title_id: id, year: 2022 },
		]);

		const res = await callApp(typedEnv, { path: "/history" });
		const data = (await res.json()) as { year: number }[];
		expect(res.status).toBe(200);
		expect(data.map((h) => h.year)).toEqual([2020, 2021, 2022]);
	});
});

describe("POST /api/history", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("appends with MAX(sort_order)+1", async () => {
		const id = await seedTitle(typedEnv.DB, { title: "OP", year: 1999 });
		for (const year of [2020, 2021, 2022]) {
			await callApp(typedEnv, {
				method: "POST",
				path: "/history",
				auth: true,
				body: { title_id: id, year },
			});
		}

		const { results } = await typedEnv.DB.prepare(
			"SELECT sort_order FROM history ORDER BY sort_order",
		).all<{ sort_order: number }>();
		expect(results.map((r) => r.sort_order)).toEqual([0, 1, 2]);
	});
});

describe("PUT /api/history/reorder", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("reorder route is handled before /:id (regression guard)", async () => {
		const id = await seedTitle(typedEnv.DB, { title: "OP", year: 1999 });
		await seedHistory(typedEnv.DB, [
			{ title_id: id, year: 2020 },
			{ title_id: id, year: 2021 },
			{ title_id: id, year: 2022 },
		]);

		const rows = await typedEnv.DB.prepare(
			"SELECT id FROM history ORDER BY sort_order",
		).all<{ id: number }>();
		const [a, b, c] = rows.results.map((r) => r.id);

		const res = await callApp(typedEnv, {
			method: "PUT",
			path: "/history/reorder",
			auth: true,
			body: { ids: [c, a, b] },
		});
		expect(res.status).toBe(200);

		const updated = await typedEnv.DB.prepare(
			"SELECT id FROM history ORDER BY sort_order",
		).all<{ id: number }>();
		expect(updated.results.map((r) => r.id)).toEqual([c, a, b]);
	});
});

describe("PUT /api/history/:id", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("updates display_name and year", async () => {
		const titleId = await seedTitle(typedEnv.DB, { title: "OP", year: 1999 });
		await seedHistory(typedEnv.DB, [{ title_id: titleId, year: 2020 }]);
		const row = await typedEnv.DB.prepare(
			"SELECT id FROM history LIMIT 1",
		).first<{ id: number }>();

		await callApp(typedEnv, {
			method: "PUT",
			path: `/history/${row!.id}`,
			auth: true,
			body: { display_name: "劇場版", year: 2021 },
		});

		const updated = await typedEnv.DB.prepare(
			"SELECT display_name, year FROM history WHERE id = ?",
		)
			.bind(row!.id)
			.first<{ display_name: string | null; year: number }>();
		expect(updated?.display_name).toBe("劇場版");
		expect(updated?.year).toBe(2021);
	});
});

describe("DELETE /api/history/:id", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("deletes the history entry", async () => {
		const titleId = await seedTitle(typedEnv.DB, { title: "OP", year: 1999 });
		await seedHistory(typedEnv.DB, [{ title_id: titleId, year: 2020 }]);
		const row = await typedEnv.DB.prepare(
			"SELECT id FROM history LIMIT 1",
		).first<{ id: number }>();

		const res = await callApp(typedEnv, {
			method: "DELETE",
			path: `/history/${row!.id}`,
			auth: true,
		});
		expect(res.status).toBe(200);

		const count = await typedEnv.DB.prepare(
			"SELECT COUNT(*) AS n FROM history",
		).first<{ n: number }>();
		expect(count?.n).toBe(0);
	});
});
