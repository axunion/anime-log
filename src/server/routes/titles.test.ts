/// <reference types="@cloudflare/vitest-pool-workers/types" />
import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { callApp } from "../../../test/helpers/app.ts";
import { applySchema, seedCast, seedTitle } from "../../../test/helpers/d1.ts";
import type { Bindings } from "../types.ts";

const typedEnv = env as unknown as Bindings;

describe("GET /api/titles", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("returns titles sorted alphabetically by title", async () => {
		await seedTitle(typedEnv.DB, { title: "Zoro", year: 2020 });
		await seedTitle(typedEnv.DB, { title: "Alpha", year: 2021 });

		const res = await callApp(typedEnv, { path: "/titles" });
		const data = (await res.json()) as { title: string }[];
		expect(res.status).toBe(200);
		expect(data.map((t) => t.title)).toEqual(["Alpha", "Zoro"]);
	});
});

describe("GET /api/titles/:id", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("returns title with nested cast array", async () => {
		const id = await seedTitle(typedEnv.DB, { title: "One Piece", year: 1999 });
		await seedCast(typedEnv.DB, id, [
			{ actor_name: "Tanaka Mayumi", character_name: "Luffy" },
		]);

		const res = await callApp(typedEnv, { path: `/titles/${id}` });
		const data = (await res.json()) as {
			title: string;
			cast: { actor_name: string }[];
		};
		expect(res.status).toBe(200);
		expect(data.title).toBe("One Piece");
		expect(data.cast).toHaveLength(1);
		expect(data.cast[0].actor_name).toBe("Tanaka Mayumi");
	});

	it("returns 404 for unknown id", async () => {
		const res = await callApp(typedEnv, { path: "/titles/9999" });
		expect(res.status).toBe(404);
	});
});

describe("POST /api/titles", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("creates title and returns id with 201", async () => {
		const res = await callApp(typedEnv, {
			method: "POST",
			path: "/titles",
			auth: true,
			body: { title: "Naruto", year: 2002 },
		});
		const data = (await res.json()) as { id: number };
		expect(res.status).toBe(201);
		expect(data.id).toBeTypeOf("number");
	});

	it("creates title with cast in a single batch", async () => {
		const res = await callApp(typedEnv, {
			method: "POST",
			path: "/titles",
			auth: true,
			body: {
				title: "Bleach",
				year: 2004,
				cast: [
					{ actor_name: "Morita Masakazu", character_name: "Ichigo" },
					{ actor_name: "Orikasa Fumiko", character_name: "Rukia" },
				],
			},
		});
		const data = (await res.json()) as { id: number };
		expect(res.status).toBe(201);

		const detail = await callApp(typedEnv, { path: `/titles/${data.id}` });
		const detailData = (await detail.json()) as { cast: unknown[] };
		expect(detailData.cast).toHaveLength(2);
	});
});

describe("PUT /api/titles/:id", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("updates only the provided field, preserving others via COALESCE", async () => {
		const id = await seedTitle(typedEnv.DB, { title: "Old Title", year: 1990 });

		await callApp(typedEnv, {
			method: "PUT",
			path: `/titles/${id}`,
			auth: true,
			body: { title: "New Title" },
		});

		const res = await callApp(typedEnv, { path: `/titles/${id}` });
		const data = (await res.json()) as { title: string; year: number };
		expect(data.title).toBe("New Title");
		expect(data.year).toBe(1990);
	});
});

describe("DELETE /api/titles/:id", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("deletes the title and cascades to cast_members", async () => {
		const id = await seedTitle(typedEnv.DB, { title: "To Delete", year: 2000 });
		await seedCast(typedEnv.DB, id, [
			{ actor_name: "Someone", character_name: "Hero" },
		]);

		const res = await callApp(typedEnv, {
			method: "DELETE",
			path: `/titles/${id}`,
			auth: true,
		});
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true });

		const castCount = await typedEnv.DB.prepare(
			"SELECT COUNT(*) AS n FROM cast_members WHERE title_id = ?",
		)
			.bind(id)
			.first<{ n: number }>();
		expect(castCount?.n).toBe(0);
	});
});
