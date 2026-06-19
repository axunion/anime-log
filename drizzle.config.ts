import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

function localD1Url(): string {
  try {
    const dir = resolve(".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
    const file = readdirSync(dir).find(
      (f) => f.endsWith(".sqlite") && f !== "metadata.sqlite",
    );
    if (file) return resolve(dir, file);
  } catch {
    // local D1 state not present yet — run `pnpm db:migrate` first
  }
  return "";
}

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/db/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url: localD1Url(),
  },
});
