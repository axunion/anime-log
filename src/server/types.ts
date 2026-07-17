import type { InferSelectModel } from "drizzle-orm";
import type { cast_members, history, titles } from "./db/schema";

export type Bindings = {
  DB: D1Database;
  API_TOKEN: string;
  ASSETS: Fetcher;
  // Optional: absent in test environments (wrangler.test.toml has no
  // [[ratelimits]]); requests pass through unlimited when unbound.
  RATE_LIMITER?: RateLimit;
  WRITE_RATE_LIMITER?: RateLimit;
};

export type Title = InferSelectModel<typeof titles>;
export type CastMember = InferSelectModel<typeof cast_members>;
export type HistoryEntry = InferSelectModel<typeof history>;
