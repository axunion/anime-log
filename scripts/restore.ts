import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { postImport } from "./lib/import-client.ts";
import { readDataArray } from "./lib/read-data-file.ts";
import { readVarsFileToken, root } from "./lib/vars.ts";

const { values } = parseArgs({
	options: {
		url: { type: "string" as const },
		data: { type: "string" as const },
		history: { type: "string" as const },
		token: { type: "string" as const },
		"yes-replace-all": { type: "boolean" as const, default: false },
	},
	strict: false,
});

const url = values.url as string | undefined;
const dataPath = values.data as string | undefined;
const historyPath = values.history as string | undefined;
const confirmed = Boolean(values["yes-replace-all"]);

const token =
	(values.token as string | undefined) ??
	process.env.API_TOKEN ??
	readVarsFileToken(resolve(root, ".dev.vars"), "PROD_API_TOKEN");

if (!url || !dataPath || !historyPath) {
	console.error(`Usage: pnpm restore \\
  --url <base-url> \\
  --data <path/to/data.json> \\
  --history <path/to/history.json> \\
  [--token <api-token>] \\
  [--yes-replace-all]

Without --yes-replace-all, prints a dry-run summary and exits.`);
	process.exit(1);
}

if (!token) {
	console.error(
		"Error: API token is required. Pass --token, set API_TOKEN env var, or add PROD_API_TOKEN to .dev.vars.",
	);
	process.exit(1);
}

if (url.startsWith("http://localhost")) {
	console.warn(
		"Warning: targeting localhost. Did you mean to use `pnpm seed:local` instead?",
	);
}

let dataPayload: unknown[];
let historyPayload: unknown[];

try {
	dataPayload = readDataArray(dataPath, "data");
} catch (err) {
	console.error(
		`Error reading ${dataPath}: ${err instanceof Error ? err.message : err}`,
	);
	process.exit(1);
}

try {
	historyPayload = readDataArray(historyPath, "history");
} catch (err) {
	console.error(
		`Error reading ${historyPath}: ${err instanceof Error ? err.message : err}`,
	);
	process.exit(1);
}

if (!confirmed) {
	console.log("Dry run — pass --yes-replace-all to execute.");
	console.log(`  Target:           ${url}`);
	console.log(
		`  Titles to import: ${Array.isArray(dataPayload) ? dataPayload.length : "?"}`,
	);
	console.log(
		`  History to import:${Array.isArray(historyPayload) ? historyPayload.length : "?"}`,
	);
	console.log("\nNo changes made.");
	process.exit(0);
}

console.log(`Restoring to ${url} ...`);

const dataResult = await postImport(
	url,
	token,
	"/api/import/data?confirm=replace-all",
	dataPayload,
);
console.log(`  titles imported: ${dataResult.imported}`);

const histResult = await postImport(
	url,
	token,
	"/api/import/history?confirm=replace-all",
	historyPayload,
);
console.log(`  history entries imported: ${histResult.imported}`);

console.log("Done.");
