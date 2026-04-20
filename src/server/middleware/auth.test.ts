/// <reference types="@cloudflare/vitest-pool-workers/types" />
import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { applySchema } from "../../../test/helpers/d1.ts";
import app from "../../server/index.ts";
import type { Bindings } from "../types.ts";

const typedEnv = env as unknown as Bindings;

function postTitles(authHeader?: string) {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (authHeader) headers.Authorization = authHeader;
	return app.fetch(
		new Request("http://localhost/api/titles", {
			method: "POST",
			headers,
			body: JSON.stringify({ title: "Test", year: 2020 }),
		}),
		typedEnv,
	);
}

describe("authMiddleware", () => {
	beforeEach(async () => {
		await applySchema(typedEnv.DB);
	});

	it("returns 401 when Authorization header is missing", async () => {
		const res = await postTitles();
		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({ error: "Unauthorized" });
	});

	it("returns 403 when token does not match", async () => {
		const res = await postTitles("Bearer wrong-token");
		expect(res.status).toBe(403);
		expect(await res.json()).toEqual({ error: "Forbidden" });
	});

	it("allows request with correct token", async () => {
		const res = await postTitles("Bearer test-token");
		expect(res.status).toBe(201);
	});
});
