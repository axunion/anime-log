import { createMiddleware } from "hono/factory";
import type { Bindings } from "../types";

const enc = new TextEncoder();

export function timingSafeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  const len = Math.max(ab.byteLength, bb.byteLength);
  let diff = ab.byteLength ^ bb.byteLength;
  for (let i = 0; i < len; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

export const authMiddleware = createMiddleware<{ Bindings: Bindings }>(
  async (c, next) => {
    // Fail closed: an unset token must never match anything.
    if (!c.env.API_TOKEN) {
      return c.json({ error: "Server misconfigured" }, 500);
    }
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.slice(7);
    if (!timingSafeEqual(token, c.env.API_TOKEN)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  },
);
