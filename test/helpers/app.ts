import app from "../../src/server/index.ts";
import type { Bindings } from "../../src/server/types.ts";

export async function callApp(
	env: Bindings,
	options: {
		method?: string;
		path: string;
		auth?: boolean;
		body?: unknown;
	},
): Promise<{ status: number; json: () => Promise<unknown> }> {
	const { method = "GET", path, auth = false, body } = options;
	const headers: Record<string, string> = {};
	if (auth) headers.Authorization = "Bearer test-token";
	if (body !== undefined) headers["Content-Type"] = "application/json";

	const res = await app.fetch(
		new Request(`http://localhost/api${path}`, {
			method,
			headers,
			body: body !== undefined ? JSON.stringify(body) : undefined,
		}),
		env,
	);
	return { status: res.status, json: () => res.json() };
}
