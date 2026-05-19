import { relative, resolve } from "node:path";
import { postImport } from "./lib/import-client.ts";
import { readDataArray, resolveDataFile } from "./lib/read-data-file.ts";
import { readVarsFileToken, root } from "./lib/vars.ts";

const BASE_URL = "http://localhost:5173";

const token =
	process.env.API_TOKEN ??
	readVarsFileToken(resolve(root, ".dev.vars.local"), "API_TOKEN") ??
	readVarsFileToken(resolve(root, ".dev.vars"), "API_TOKEN");

if (!token) {
	console.error("Error: API_TOKEN is required. Set it in .dev.vars or pass as an env var.");
	process.exit(1);
}

let dataPayload!: unknown[];
let historyPayload!: unknown[];

try {
	const dataPath = resolveDataFile(
		resolve(root, "data/data.json"),
		resolve(root, "data/data.js"),
	);
	console.log(`Using data file:    ${relative(root, dataPath)}`);
	dataPayload = readDataArray(dataPath, "data");
} catch (err) {
	console.error(`Error: ${err instanceof Error ? err.message : err}`);
	console.error("Export data from the Admin UI first, or place data/data.js with PAGE.data.");
	process.exit(1);
}

try {
	const historyPath = resolveDataFile(
		resolve(root, "data/history.json"),
		resolve(root, "data/history.js"),
	);
	console.log(`Using history file: ${relative(root, historyPath)}`);
	historyPayload = readDataArray(historyPath, "history");
} catch (err) {
	console.error(`Error: ${err instanceof Error ? err.message : err}`);
	console.error("Export history from the Admin UI first, or place data/history.js with PAGE.history.");
	process.exit(1);
}

// Filter history entries whose title doesn't exist in the data set (legacy data inconsistency).
const titleSet = new Set(dataPayload.map((e) => (e as { title?: unknown }).title));
const before = historyPayload.length;
historyPayload = historyPayload.filter((e) => titleSet.has((e as { title?: unknown }).title));
if (historyPayload.length < before) {
	console.warn(`  [warn] Skipped ${before - historyPayload.length} history entries with unknown title`);
}

console.log(`Seeding local DB at ${BASE_URL} ...`);

const dataResult = await postImport(
	BASE_URL,
	token,
	"/api/import/data?confirm=replace-all",
	dataPayload,
);
console.log(`  titles imported: ${dataResult.imported}`);

const histResult = await postImport(
	BASE_URL,
	token,
	"/api/import/history?confirm=replace-all",
	historyPayload,
);
console.log(`  history entries imported: ${histResult.imported}`);

console.log("Done.");
