import { is, SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import {
	getTableConfig,
	type SQLiteColumn,
	type SQLiteTable,
} from "drizzle-orm/sqlite-core";
import { cast_members, history, titles } from "../../src/server/db/schema";

function defaultToSQL(val: unknown): string | undefined {
	if (val === null || val === undefined) return undefined;
	if (is(val, SQL)) {
		const chunks = (val as SQL).queryChunks as Array<{ value: unknown }>;
		return chunks
			.map((c) => {
				if (Array.isArray(c.value)) return (c.value as string[]).join("");
				if (typeof c.value === "string") return c.value;
				return "";
			})
			.join("");
	}
	if (typeof val === "string") return `'${val}'`;
	return String(val);
}

function columnDDL(col: SQLiteColumn): string {
	const isPK = col.primary;
	const isAutoInc = (col as unknown as { autoIncrement: boolean })
		.autoIncrement;
	let def = `  "${col.name}" ${col.getSQLType().toUpperCase()}`;
	if (isPK) {
		def += " PRIMARY KEY";
		if (isAutoInc) def += " AUTOINCREMENT";
	}
	if (col.notNull && !isPK) def += " NOT NULL";
	if (col.isUnique) def += " UNIQUE";
	if (col.hasDefault) {
		const expr = defaultToSQL(col.default);
		if (expr !== undefined) def += ` DEFAULT ${expr}`;
	}
	return def;
}

function buildCreateTable(table: SQLiteTable): string {
	const { name, columns, foreignKeys } = getTableConfig(table);
	const colDefs = columns.map(columnDDL);
	const fkDefs = (
		foreignKeys as Array<{
			onDelete?: string;
			reference: () => {
				columns: SQLiteColumn[];
				foreignTable: SQLiteTable;
				foreignColumns: SQLiteColumn[];
			};
		}>
	).map((fk) => {
		const ref = fk.reference();
		const fromCols = ref.columns.map((c) => `"${c.name}"`).join(", ");
		const toTable = getTableConfig(ref.foreignTable).name;
		const toCols = ref.foreignColumns.map((c) => `"${c.name}"`).join(", ");
		let def = `  FOREIGN KEY (${fromCols}) REFERENCES "${toTable}" (${toCols})`;
		if (fk.onDelete) def += ` ON DELETE ${fk.onDelete.toUpperCase()}`;
		return def;
	});
	return `CREATE TABLE IF NOT EXISTS "${name}" (\n${[...colDefs, ...fkDefs].join(",\n")}\n)`;
}

function buildIndexStatements(table: SQLiteTable): string[] {
	const { name: tableName, indexes } = getTableConfig(table);
	return (
		indexes as Array<{ config: { name: string; columns: SQLiteColumn[] } }>
	).map((idx) => {
		const cols = idx.config.columns.map((c) => `"${c.name}"`).join(", ");
		return `CREATE INDEX IF NOT EXISTS "${idx.config.name}" ON "${tableName}" (${cols})`;
	});
}

const STATEMENTS = [
	buildCreateTable(titles),
	buildCreateTable(cast_members),
	...buildIndexStatements(cast_members),
	buildCreateTable(history),
	...buildIndexStatements(history),
];

export async function applySchema(db: D1Database) {
	await db.batch(
		STATEMENTS.map((ddl) => db.prepare(ddl)) as [
			D1PreparedStatement,
			...D1PreparedStatement[],
		],
	);
	// Clear data between tests (order matters: child tables first)
	await db.batch([
		db.prepare("DELETE FROM history"),
		db.prepare("DELETE FROM cast_members"),
		db.prepare("DELETE FROM titles"),
	]);
}

export async function seedTitle(
	db: D1Database,
	{ title, year }: { title: string; year: number },
): Promise<number> {
	const drizzleDb = drizzle(db);
	const [result] = await drizzleDb
		.insert(titles)
		.values({ title, year })
		.returning({ id: titles.id });
	return result.id;
}

export async function seedCast(
	db: D1Database,
	titleId: number,
	cast: { actor_name: string; character_name: string }[],
) {
	if (cast.length === 0) return;
	const drizzleDb = drizzle(db);
	await drizzleDb.insert(cast_members).values(
		cast.map((m, i) => ({
			title_id: titleId,
			actor_name: m.actor_name,
			character_name: m.character_name,
			sort_order: i,
		})),
	);
}

export async function seedHistory(
	db: D1Database,
	entries: {
		title_id: number;
		display_name?: string | null;
		year: number;
	}[],
) {
	if (entries.length === 0) return;
	const drizzleDb = drizzle(db);
	await drizzleDb.insert(history).values(
		entries.map((e, i) => ({
			title_id: e.title_id,
			display_name: e.display_name ?? null,
			year: e.year,
			sort_order: i,
		})),
	);
}
