export function buildCastInsertStmts(
	db: D1Database,
	titleId: number,
	members: { actor_name: string; character_name: string }[],
): D1PreparedStatement[] {
	const stmt = db.prepare(
		"INSERT INTO cast_members (title_id, actor_name, character_name, sort_order) VALUES (?, ?, ?, ?)",
	);
	return members.map((m, i) => stmt.bind(titleId, m.actor_name, m.character_name, i));
}
