import { createMiddleware } from "hono/factory";
import type { Bindings } from "../types";

export const authMiddleware = createMiddleware<{ Bindings: Bindings }>(
	async (c, next) => {
		const authHeader = c.req.header("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return c.json({ error: "Unauthorized" }, 401);
		}
		const token = authHeader.slice(7);
		if (token !== c.env.API_TOKEN) {
			return c.json({ error: "Forbidden" }, 403);
		}
		await next();
	},
);
