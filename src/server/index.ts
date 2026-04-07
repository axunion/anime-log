import { Hono } from "hono";
import { castRoutes } from "./routes/cast";
import { historyRoutes } from "./routes/history";
import { titlesRoutes } from "./routes/titles";
import type { Bindings } from "./types";

const app = new Hono<{ Bindings: Bindings }>();

app.route("/api/titles", titlesRoutes);
app.route("/api", castRoutes);
app.route("/api/history", historyRoutes);

export default app;
