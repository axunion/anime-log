import type { InferSelectModel } from "drizzle-orm";
import type { cast_members, history, titles } from "./db/schema";

export type Bindings = {
	DB: D1Database;
	API_TOKEN: string;
	ASSETS: Fetcher;
};

export type Title = InferSelectModel<typeof titles>;
export type CastMember = InferSelectModel<typeof cast_members>;
export type HistoryEntry = InferSelectModel<typeof history>;
