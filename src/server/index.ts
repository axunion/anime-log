import { Hono } from "hono";
import { ZodError } from "zod";
import { timingSafeEqual } from "./middleware/auth";
import { castRoutes } from "./routes/cast";
import { exportRoutes } from "./routes/export";
import { historyRoutes } from "./routes/history";
import { importRoutes } from "./routes/import";
import { titlesRoutes } from "./routes/titles";
import type { Bindings } from "./types";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", async (c, next) => {
  await next();
  // ASSETS responses have immutable headers; clone to allow modification.
  const headers = new Headers(c.res.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  c.res = new Response(c.res.body, {
    status: c.res.status,
    statusText: c.res.statusText,
    headers,
  });
});

app.route("/api/titles", titlesRoutes);
app.route("/api/cast", castRoutes);
app.route("/api/history", historyRoutes);
app.route("/api/export", exportRoutes);
app.route("/api/import", importRoutes);

// Block direct access to admin page — existence must not be revealed.
// Use new Response() directly to bypass the notFound → ASSETS proxy.
app.get("/admin.html", () => new Response(null, { status: 404 }));
app.get("/admin", () => new Response(null, { status: 404 }));
app.get("/admin/", () => new Response(null, { status: 404 }));

/** Escape a string for safe use as an HTML attribute value (inside double-quotes). */
function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

// Secret path grants access: /<API_TOKEN>
// Full-segment /:secret is required — inline-segment (/prefix-:secret) does not
// work in @cloudflare/vite-plugin dev mode.
// When the token does NOT match, fall through to ASSETS so single-segment static
// files (favicon.svg, index.html, etc.) are still served correctly.
// Multi-segment paths (/assets/…) are handled by the notFound → ASSETS proxy.
app.get("/:secret", async (c) => {
  // Guard: ASSETS is not available in test environments.
  if (!c.env.ASSETS) return c.json({ error: "Not Found" }, 404);
  const secret = c.req.param("secret") ?? "";
  if (timingSafeEqual(secret, c.env.API_TOKEN)) {
    const assetUrl = new URL("/admin.html", c.req.url);
    const resp = await c.env.ASSETS.fetch(assetUrl.toString());
    // Propagate the real error status rather than masking it as 200.
    if (!resp.ok) return resp;
    const html = await resp.text();
    // Inject base href (fixes relative paths in dev mode) and a <meta> tag so
    // admin/main.ts can read the token without an inline script.
    // Using <meta> keeps the page compatible with Content-Security-Policy:
    // default-src 'self' (inline scripts are blocked by that policy).
    const injected = html.replace(
      "<title>",
      `<base href="/"><meta name="x-api-token" content="${escapeAttr(c.env.API_TOKEN)}"><title>`,
    );
    // Propagate ASSETS response headers (including CSP from public/_headers),
    // then override Content-Type for the modified HTML.
    const respHeaders = new Headers(resp.headers);
    respHeaders.set("Content-Type", "text/html; charset=UTF-8");
    return new Response(injected, { status: 200, headers: respHeaders });
  }
  // Not the token — proxy to ASSETS to serve any matching static file.
  const assetUrl = new URL(c.req.path, c.req.url);
  return c.env.ASSETS.fetch(assetUrl.toString());
});

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

// With run_worker_first = true, Worker handles all requests.
// Proxy unmatched non-API paths to the ASSETS binding to serve static files.
// /api/* paths always return JSON 404 so API clients get a structured response.
// Falls back to JSON 404 in test environments where ASSETS is not bound.
app.notFound(async (c) => {
  if (c.env.ASSETS && !c.req.path.startsWith("/api")) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.json({ error: "Not Found" }, 404);
});

export default app;
