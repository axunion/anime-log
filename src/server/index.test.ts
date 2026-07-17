/// <reference types="@cloudflare/vitest-pool-workers/types" />
import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { applySchema } from "../../test/helpers/d1.ts";
import app from "./index.ts";
import type { Bindings } from "./types.ts";

const typedEnv = env as unknown as Bindings;

describe("security headers", () => {
  beforeEach(() => applySchema(typedEnv.DB));

  it("sets X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy, and X-Robots-Tag on success responses", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/titles"),
      typedEnv,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("Strict-Transport-Security")).toMatch(/max-age=/);
    expect(res.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex");
  });

  it("sets security headers on error responses", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/nonexistent"),
      typedEnv,
    );
    expect(res.status).toBe(404);
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });
});

describe("admin page existence concealment", () => {
  it("returns 404 for GET /admin.html", async () => {
    const res = await app.fetch(
      new Request("http://localhost/admin.html"),
      typedEnv,
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 for GET /admin", async () => {
    const res = await app.fetch(
      new Request("http://localhost/admin"),
      typedEnv,
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 for GET /admin/", async () => {
    const res = await app.fetch(
      new Request("http://localhost/admin/"),
      typedEnv,
    );
    expect(res.status).toBe(404);
  });
});

describe("/:secret admin routing", () => {
  // In the test environment ASSETS is not bound, so the guard `!c.env.ASSETS`
  // fires and returns JSON 404 regardless of whether the token matches.
  // This verifies the guard is in place and that /:secret does not absorb
  // multi-segment /api/* routes.
  it("returns JSON 404 in test environment where ASSETS is not bound", async () => {
    const res = await app.fetch(
      new Request("http://localhost/test-token"),
      typedEnv,
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Not Found");
  });

  it("does not absorb multi-segment /api paths (two segments bypass /:secret)", async () => {
    // /api/titles has two path segments and is handled by the mounted router,
    // not by /:secret which only matches single-segment root paths.
    const res = await app.fetch(
      new Request("http://localhost/api/titles"),
      typedEnv,
    );
    expect(res.status).toBe(200);
  });
});

describe("rate limiting", () => {
  beforeEach(() => applySchema(typedEnv.DB));

  const limiter = (success: boolean): RateLimit => ({
    limit: async () => ({ success }),
  });

  it("returns 429 with Retry-After when the global limiter rejects", async () => {
    const res = await app.fetch(new Request("http://localhost/api/titles"), {
      ...typedEnv,
      RATE_LIMITER: limiter(false),
    });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
  });

  it("passes through when limiters allow the request", async () => {
    const res = await app.fetch(new Request("http://localhost/api/titles"), {
      ...typedEnv,
      RATE_LIMITER: limiter(true),
      WRITE_RATE_LIMITER: limiter(true),
    });
    expect(res.status).toBe(200);
  });

  it("does not apply the write limiter to GET requests", async () => {
    const res = await app.fetch(new Request("http://localhost/api/titles"), {
      ...typedEnv,
      WRITE_RATE_LIMITER: limiter(false),
    });
    expect(res.status).toBe(200);
  });

  it("returns 429 for writes when the write limiter rejects", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/titles", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: "Blocked", year: 2024 }),
      }),
      { ...typedEnv, WRITE_RATE_LIMITER: limiter(false) },
    );
    expect(res.status).toBe(429);
  });
});

describe("notFound", () => {
  it("returns JSON 404 for unknown /api paths", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/this-does-not-exist"),
      typedEnv,
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Not Found");
  });
});
