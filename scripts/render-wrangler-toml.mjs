import { readFileSync, writeFileSync } from "node:fs";

// Replaces __DATABASE_ID__ in wrangler.toml with the real Cloudflare D1 database ID.
// Run by the GitHub Actions deploy workflow before deploying to production.
// Local development uses wrangler.toml as-is (placeholder ID is fine for local D1).

const OUT = "wrangler.toml";
const PLACEHOLDER = "__DATABASE_ID__";

const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;

if (!databaseId) {
	console.error(
		"[render-wrangler-toml] Error: CLOUDFLARE_D1_DATABASE_ID is required",
	);
	process.exit(1);
}

const content = readFileSync(OUT, "utf8");
const output = content.replace(PLACEHOLDER, databaseId);
writeFileSync(OUT, output);
console.log(`[render-wrangler-toml] Injected database ID into ${OUT}`);
