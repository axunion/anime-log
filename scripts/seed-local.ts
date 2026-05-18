import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { postImport } from "./lib/import-client.ts";
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

let dataPayload: unknown;
let historyPayload: unknown;

try {
	dataPayload = JSON.parse(readFileSync(resolve(root, "data/data.json"), "utf-8"));
} catch {
	console.error("Error: data/data.json not found. Export data from the Admin UI first.");
	process.exit(1);
}

try {
	historyPayload = JSON.parse(readFileSync(resolve(root, "data/history.json"), "utf-8"));
} catch {
	console.error("Error: data/history.json not found. Export history from the Admin UI first.");
	process.exit(1);
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
