import { existsSync, readFileSync, writeFileSync } from "node:fs";

const OUT = "wrangler.toml";
const TEMPLATE = "wrangler.example.toml";
const PLACEHOLDER = "__DATABASE_ID__";

const isPostinstall = process.env.npm_lifecycle_event === "postinstall";

// During postinstall, skip if wrangler.toml already exists (local dev machines).
if (isPostinstall && existsSync(OUT)) {
	process.exit(0);
}

const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;

if (!databaseId && isPostinstall) {
	console.log(
		"[render-wrangler-toml] CLOUDFLARE_D1_DATABASE_ID not set — skipping.",
	);
	console.log(
		"  To generate wrangler.toml manually: CLOUDFLARE_D1_DATABASE_ID=<id> node scripts/render-wrangler-toml.mjs",
	);
	process.exit(0);
}

if (!databaseId) {
	console.error(
		"[render-wrangler-toml] Error: CLOUDFLARE_D1_DATABASE_ID is required",
	);
	process.exit(1);
}

const template = readFileSync(TEMPLATE, "utf8");
const output = template.replace(PLACEHOLDER, databaseId);
writeFileSync(OUT, output);
console.log(`[render-wrangler-toml] Generated ${OUT}`);
