import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

type DataEntry = {
	title: string;
	year: string | number;
	cast: [string, string][];
};

type HistoryEntry = {
	title: string;
	name?: string;
	year: string | number;
};

function readJsonOrJs<T>(jsonPath: string, jsPath: string, prefix: string): T {
	try {
		return JSON.parse(readFileSync(jsonPath, "utf-8")) as T;
	} catch {
		// Fall back to legacy JS format (PAGE.data = [...]) and eval it
		const js = readFileSync(jsPath, "utf-8");
		const body = js
			.slice(js.indexOf(prefix) + prefix.length)
			.trimEnd()
			.replace(/;$/, "");
		// biome-ignore lint/security/noGlobalEval: legacy files may use single-quoted keys that JSON.parse cannot handle
		return eval(`(${body})`) as T;
	}
}

function toNumber(val: string | number): number {
	return typeof val === "string" ? parseInt(val, 10) : val;
}

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const dataEntries = readJsonOrJs<DataEntry[]>(
	resolve(root, "data/data.json"),
	resolve(root, "data/data.js"),
	"PAGE.data = ",
);

const historyEntries = readJsonOrJs<HistoryEntry[]>(
	resolve(root, "data/history.json"),
	resolve(root, "data/history.js"),
	"PAGE.history = ",
);

// Inject placeholder entries for orphan titles referenced in history
const dataTitleSet = new Set(dataEntries.map((e) => e.title));
const seen = new Set<string>();
for (const h of historyEntries) {
	if (!dataTitleSet.has(h.title) && !seen.has(h.title)) {
		console.warn(
			`[WARN] orphan title in history: "${h.title}" → injecting placeholder`,
		);
		dataEntries.push({ title: h.title, year: h.year, cast: [] });
		seen.add(h.title);
	}
}

const baseUrl = process.env.BASE_URL ?? "http://localhost:5173";

function readVarsFileToken(filePath: string): string | undefined {
	try {
		const content = readFileSync(filePath, "utf-8");
		return content.match(/^API_TOKEN\s*=\s*(.+)$/m)?.[1]?.trim();
	} catch {
		return undefined;
	}
}

function resolveToken(rootDir: string): string | undefined {
	return process.env.API_TOKEN ?? readVarsFileToken(resolve(rootDir, ".dev.vars"));
}

const isLocal = baseUrl.startsWith("http://localhost");
const token = isLocal ? resolveToken(root) : process.env.API_TOKEN;
if (!token) {
	const hint = isLocal
		? "Set API_TOKEN in .dev.vars.local, .dev.vars, or pass it as an env var."
		: "Pass API_TOKEN as an env var.";
	console.error(`Error: API_TOKEN is required. ${hint}`);
	process.exit(1);
}

const headers = {
	"Content-Type": "application/json",
	Authorization: `Bearer ${token}`,
};

async function postImport(path: string, payload: unknown): Promise<{ imported: number }> {
	console.log(`Importing → ${baseUrl}${path} ...`);
	const res = await fetch(`${baseUrl}${path}`, {
		method: "POST",
		headers,
		body: JSON.stringify(payload),
	});
	if (!res.ok) {
		console.error(`Error (${res.status}): ${await res.text()}`);
		process.exit(1);
	}
	return res.json() as Promise<{ imported: number }>;
}

const dataPayload = dataEntries.map((e) => ({
	title: e.title,
	year: toNumber(e.year),
	cast: e.cast.filter(([actor, character]) => actor.length > 0 && character.length > 0),
}));

const historyPayload = historyEntries.map((e) => ({
	title: e.title,
	year: toNumber(e.year),
	...(e.name ? { name: e.name } : {}),
}));

const dataResult = await postImport("/api/import/data", dataPayload);
console.log(`  titles imported: ${dataResult.imported}`);

const histResult = await postImport("/api/import/history", historyPayload);
console.log(`  history entries imported: ${histResult.imported}`);

console.log("Done.");
