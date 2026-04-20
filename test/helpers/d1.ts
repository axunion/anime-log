const STATEMENTS = [
	`CREATE TABLE IF NOT EXISTS titles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    year INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
	`CREATE TABLE IF NOT EXISTS cast_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
    actor_name TEXT NOT NULL,
    character_name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
	"CREATE INDEX IF NOT EXISTS idx_cast_title_id ON cast_members(title_id)",
	"CREATE INDEX IF NOT EXISTS idx_cast_actor_name ON cast_members(actor_name)",
	`CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
    display_name TEXT,
    year INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
	"CREATE INDEX IF NOT EXISTS idx_history_title_id ON history(title_id)",
];

export async function applySchema(db: D1Database) {
	for (const sql of STATEMENTS) {
		await db.prepare(sql).run();
	}
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
	const result = await db
		.prepare("INSERT INTO titles (title, year) VALUES (?, ?) RETURNING id")
		.bind(title, year)
		.first<{ id: number }>();
	return result!.id;
}

export async function seedCast(
	db: D1Database,
	titleId: number,
	cast: { actor_name: string; character_name: string }[],
) {
	if (cast.length === 0) return;
	const stmts = cast.map((m, i) =>
		db
			.prepare(
				"INSERT INTO cast_members (title_id, actor_name, character_name, sort_order) VALUES (?, ?, ?, ?)",
			)
			.bind(titleId, m.actor_name, m.character_name, i),
	);
	await db.batch(stmts);
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
	const stmts = entries.map((e, i) =>
		db
			.prepare(
				"INSERT INTO history (title_id, display_name, year, sort_order) VALUES (?, ?, ?, ?)",
			)
			.bind(e.title_id, e.display_name ?? null, e.year, i),
	);
	await db.batch(stmts);
}
