/// <reference types="@cloudflare/vitest-pool-workers/types" />
import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import {
	applySchema,
	seedTitle,
	seedCast,
	seedHistory,
} from "../../../test/helpers/d1.ts";
import { callApp } from "../../../test/helpers/app.ts";
import type { Bindings } from "../types.ts";

const typedEnv = env as unknown as Bindings;

describe("GET /api/export/data", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("returns titles with nested cast as [actor, char] tuples", async () => {
		const id = await seedTitle(typedEnv.DB, { title: "Eva", year: 1995 });
		await seedCast(typedEnv.DB, id, [
			{ actor_name: "Ogata Megumi", character_name: "Shinji" },
			{ actor_name: "Mitsuishi Kotono", character_name: "Misato" },
		]);

		const res = await callApp(typedEnv, { path: "/export/data" });
		const data = (await res.json()) as {
			title: string;
			year: number;
			cast: [string, string][];
		}[];
		expect(res.status).toBe(200);
		expect(data).toHaveLength(1);
		expect(data[0].title).toBe("Eva");
		expect(data[0].cast).toEqual([
			["Ogata Megumi", "Shinji"],
			["Mitsuishi Kotono", "Misato"],
		]);
	});

	it("includes title with empty cast array when no cast_members exist", async () => {
		await seedTitle(typedEnv.DB, { title: "No Cast Title", year: 2000 });

		const res = await callApp(typedEnv, { path: "/export/data" });
		const data = (await res.json()) as { title: string; cast: unknown[] }[];
		expect(data[0].title).toBe("No Cast Title");
		expect(data[0].cast).toEqual([]);
	});
});

describe("GET /api/export/history", () => {
	beforeEach(() => applySchema(typedEnv.DB));

	it("omits name field when display_name is null", async () => {
		const id = await seedTitle(typedEnv.DB, { title: "OP", year: 1999 });
		await seedHistory(typedEnv.DB, [{ title_id: id, year: 2020 }]);

		const res = await callApp(typedEnv, { path: "/export/history" });
		const data = (await res.json()) as Record<string, unknown>[];
		expect(data[0]).toEqual({ title: "OP", year: 2020 });
		expect("name" in data[0]).toBe(false);
	});

	it("includes name field when display_name is set", async () => {
		const id = await seedTitle(typedEnv.DB, { title: "OP", year: 1999 });
		await seedHistory(typedEnv.DB, [
			{ title_id: id, display_name: "劇場版", year: 2021 },
		]);

		const res = await callApp(typedEnv, { path: "/export/history" });
		const data = (await res.json()) as Record<string, unknown>[];
		expect(data[0]).toEqual({ title: "OP", name: "劇場版", year: 2021 });
	});
});
