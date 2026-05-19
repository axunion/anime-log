import { existsSync, readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

export function resolveDataFile(jsonPath: string, jsPath: string): string {
	if (existsSync(jsonPath)) return jsonPath;
	if (existsSync(jsPath)) return jsPath;
	throw new Error(`Neither ${jsonPath} nor ${jsPath} exists`);
}

export function readDataArray(filePath: string, globalKey: "data" | "history"): unknown[] {
	const raw = readFileSync(filePath, "utf-8");

	if (filePath.endsWith(".json")) {
		return JSON.parse(raw) as unknown[];
	}

	if (filePath.endsWith(".js")) {
		const ctx: { PAGE: Record<string, unknown> } = { PAGE: {} };
		runInNewContext(raw, ctx, { filename: filePath });
		const value = ctx.PAGE[globalKey];
		if (!Array.isArray(value)) {
			throw new Error(`${filePath} did not assign PAGE.${globalKey} to an array`);
		}
		return sanitizeLegacyData(value);
	}

	throw new Error(`Unsupported file extension: ${filePath} (expected .json or .js)`);
}

// Filter out cast pairs where either actor or character name is empty (legacy data quality issue).
function sanitizeLegacyData(data: unknown[]): unknown[] {
	return data.map((entry) => {
		if (typeof entry !== "object" || entry === null || !("cast" in entry)) return entry;
		const e = entry as Record<string, unknown>;
		if (!Array.isArray(e.cast)) return entry;
		const filtered = e.cast.filter(
			(pair) => Array.isArray(pair) && pair[0] && pair[1],
		);
		if (filtered.length === e.cast.length) return entry;
		console.warn(`  [warn] Skipped ${e.cast.length - filtered.length} empty cast entries in "${e.title}"`);
		return { ...e, cast: filtered };
	});
}
