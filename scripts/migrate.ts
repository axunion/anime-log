import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

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

function esc(s: string): string {
	return s.replace(/'/g, "''");
}

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

import { fileURLToPath } from "node:url";

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

const lines: string[] = [];

// titles and cast_members
const titleIdMap = new Map<string, number>();
let titleId = 1;

for (const entry of dataEntries) {
	const year =
		typeof entry.year === "string" ? parseInt(entry.year, 10) : entry.year;
	lines.push(
		`INSERT INTO titles (id, title, year) VALUES (${titleId}, '${esc(entry.title)}', ${year});`,
	);
	titleIdMap.set(entry.title, titleId);

	for (let i = 0; i < entry.cast.length; i++) {
		const [actor, character] = entry.cast[i];
		lines.push(
			`INSERT INTO cast_members (title_id, actor_name, character_name, sort_order) VALUES (${titleId}, '${esc(actor)}', '${esc(character)}', ${i});`,
		);
	}

	titleId++;
}

// Titles in history but missing from data — create placeholder rows
const historyOrphans = historyEntries.filter((h) => !titleIdMap.has(h.title));
const orphanTitles = new Map<string, number>();
for (const h of historyOrphans) {
	if (!orphanTitles.has(h.title)) {
		const year = typeof h.year === "string" ? parseInt(h.year, 10) : h.year;
		console.warn(
			`[WARN] orphan title in history: "${h.title}" → creating placeholder`,
		);
		lines.push(
			`INSERT INTO titles (id, title, year) VALUES (${titleId}, '${esc(h.title)}', ${year});`,
		);
		orphanTitles.set(h.title, titleId);
		titleId++;
	}
}

// history entries
for (let i = 0; i < historyEntries.length; i++) {
	const h = historyEntries[i];
	const tid = titleIdMap.get(h.title) ?? orphanTitles.get(h.title)!;
	const year = typeof h.year === "string" ? parseInt(h.year, 10) : h.year;
	const displayName = h.name ? `'${esc(h.name)}'` : "NULL";
	lines.push(
		`INSERT INTO history (title_id, display_name, year, sort_order) VALUES (${tid}, ${displayName}, ${year}, ${i});`,
	);
}

const out = `${lines.join("\n")}\n`;
const outPath = resolve(root, "migrations/0002_seed.sql");
writeFileSync(outPath, out, "utf-8");

console.log(`Generated ${outPath}`);
console.log(`  titles:       ${titleIdMap.size + orphanTitles.size}`);
console.log(
	`  cast_members: ${dataEntries.reduce((s, e) => s + e.cast.length, 0)}`,
);
console.log(`  history:      ${historyEntries.length}`);
