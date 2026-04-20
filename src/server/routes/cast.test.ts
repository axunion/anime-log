/// <reference types="@cloudflare/vitest-pool-workers/types" />
import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { callApp } from "../../../test/helpers/app.ts";
import { applySchema, seedCast, seedTitle } from "../../../test/helpers/d1.ts";
import type { Bindings } from "../types.ts";

const typedEnv = env as unknown as Bindings;

describe("GET /api/cast", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("returns 400 when actor query param is missing", async () => {
		const res = await callApp(typedEnv, { path: "/cast" });
		expect(res.status).toBe(400);
	});

	it("returns matching cast entries across multiple titles", async () => {
		const id1 = await seedTitle(typedEnv.DB, { title: "Bleach", year: 2004 });
		const id2 = await seedTitle(typedEnv.DB, { title: "Naruto", year: 2002 });
		await seedCast(typedEnv.DB, id1, [
			{ actor_name: "Morita Masakazu", character_name: "Ichigo" },
		]);
		await seedCast(typedEnv.DB, id2, [
			{ actor_name: "Morita Masakazu", character_name: "Kakashi" },
		]);

		const res = await callApp(typedEnv, {
			path: "/cast?actor=Morita%20Masakazu",
		});
		const data = (await res.json()) as { title: string }[];
		expect(res.status).toBe(200);
		expect(data).toHaveLength(2);
		const titles = data.map((d) => d.title).sort();
		expect(titles).toEqual(["Bleach", "Naruto"]);
	});

	it("returns empty array for unknown actor", async () => {
		const res = await callApp(typedEnv, { path: "/cast?actor=Unknown" });
		expect(await res.json()).toEqual([]);
	});
});

describe("POST /api/titles/:id/cast", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("assigns sort_order sequentially via MAX+1", async () => {
		const titleId = await seedTitle(typedEnv.DB, {
			title: "One Piece",
			year: 1999,
		});

		for (const [actor, char] of [
			["A", "X"],
			["B", "Y"],
			["C", "Z"],
		]) {
			await callApp(typedEnv, {
				method: "POST",
				path: `/titles/${titleId}/cast`,
				auth: true,
				body: { actor_name: actor, character_name: char },
			});
		}

		const { results } = await typedEnv.DB.prepare(
			"SELECT sort_order FROM cast_members WHERE title_id = ? ORDER BY sort_order",
		)
			.bind(titleId)
			.all<{ sort_order: number }>();
		expect(results.map((r) => r.sort_order)).toEqual([0, 1, 2]);
	});
});

describe("PUT /api/titles/:id/cast (replace all)", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("replaces all cast members for the title", async () => {
		const titleId = await seedTitle(typedEnv.DB, { title: "HxH", year: 2011 });
		await seedCast(typedEnv.DB, titleId, [
			{ actor_name: "Old Actor 1", character_name: "Gon" },
			{ actor_name: "Old Actor 2", character_name: "Killua" },
		]);

		await callApp(typedEnv, {
			method: "PUT",
			path: `/titles/${titleId}/cast`,
			auth: true,
			body: {
				cast: [{ actor_name: "New Actor", character_name: "Kurapika" }],
			},
		});

		const { results } = await typedEnv.DB.prepare(
			"SELECT actor_name FROM cast_members WHERE title_id = ?",
		)
			.bind(titleId)
			.all<{ actor_name: string }>();
		expect(results).toHaveLength(1);
		expect(results[0].actor_name).toBe("New Actor");
	});

	it("can clear all cast by passing empty array", async () => {
		const titleId = await seedTitle(typedEnv.DB, { title: "AoT", year: 2013 });
		await seedCast(typedEnv.DB, titleId, [
			{ actor_name: "Actor", character_name: "Eren" },
		]);

		await callApp(typedEnv, {
			method: "PUT",
			path: `/titles/${titleId}/cast`,
			auth: true,
			body: { cast: [] },
		});

		const { results } = await typedEnv.DB.prepare(
			"SELECT id FROM cast_members WHERE title_id = ?",
		)
			.bind(titleId)
			.all();
		expect(results).toHaveLength(0);
	});
});

describe("PUT /api/cast/:id", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("updates individual cast member fields via COALESCE", async () => {
		const titleId = await seedTitle(typedEnv.DB, { title: "FMA", year: 2003 });
		await seedCast(typedEnv.DB, titleId, [
			{ actor_name: "Original Actor", character_name: "Ed" },
		]);
		const castRow = await typedEnv.DB.prepare(
			"SELECT id FROM cast_members WHERE title_id = ?",
		)
			.bind(titleId)
			.first<{ id: number }>();

		await callApp(typedEnv, {
			method: "PUT",
			path: `/cast/${castRow!.id}`,
			auth: true,
			body: { actor_name: "Updated Actor" },
		});

		const updated = await typedEnv.DB.prepare(
			"SELECT actor_name, character_name FROM cast_members WHERE id = ?",
		)
			.bind(castRow!.id)
			.first<{ actor_name: string; character_name: string }>();
		expect(updated?.actor_name).toBe("Updated Actor");
		expect(updated?.character_name).toBe("Ed");
	});
});

describe("DELETE /api/cast/:id", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("deletes single cast member", async () => {
		const titleId = await seedTitle(typedEnv.DB, { title: "Eva", year: 1995 });
		await seedCast(typedEnv.DB, titleId, [
			{ actor_name: "Ogata Megumi", character_name: "Shinji" },
		]);
		const castRow = await typedEnv.DB.prepare(
			"SELECT id FROM cast_members WHERE title_id = ?",
		)
			.bind(titleId)
			.first<{ id: number }>();

		const res = await callApp(typedEnv, {
			method: "DELETE",
			path: `/cast/${castRow!.id}`,
			auth: true,
		});
		expect(res.status).toBe(200);

		const count = await typedEnv.DB.prepare(
			"SELECT COUNT(*) AS n FROM cast_members WHERE id = ?",
		)
			.bind(castRow!.id)
			.first<{ n: number }>();
		expect(count?.n).toBe(0);
	});
});
