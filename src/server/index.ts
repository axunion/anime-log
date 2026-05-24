import { Hono } from "hono";
import { ZodError } from "zod";
import { castRoutes } from "./routes/cast";
import { exportRoutes } from "./routes/export";
import { historyRoutes } from "./routes/history";
import { importRoutes } from "./routes/import";
import { titlesRoutes } from "./routes/titles";
import type { Bindings } from "./types";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", async (c, next) => {
	await next();
	c.res.headers.set("X-Content-Type-Options", "nosniff");
	c.res.headers.set("X-Frame-Options", "DENY");
});

app.route("/api/titles", titlesRoutes);
app.route("/api/cast", castRoutes);
app.route("/api/history", historyRoutes);
app.route("/api/export", exportRoutes);
app.route("/api/import", importRoutes);

app.onError((err, c) => {
	if (err instanceof ZodError) {
		return c.json({ error: "Bad Request", issues: err.issues }, 400);
	}
	if (
		err instanceof Error &&
		err.message.includes("UNIQUE constraint failed")
	) {
		return c.json({ error: "Already exists" }, 409);
	}
	console.error(err);
	return c.json({ error: "Internal Server Error" }, 500);
});

app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;
