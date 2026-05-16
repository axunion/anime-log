import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const titles = sqliteTable("titles", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	title: text("title").notNull().unique(),
	year: integer("year").notNull(),
	created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
	updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const cast_members = sqliteTable(
	"cast_members",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		title_id: integer("title_id")
			.notNull()
			.references(() => titles.id, { onDelete: "cascade" }),
		actor_name: text("actor_name").notNull(),
		character_name: text("character_name").notNull(),
		sort_order: integer("sort_order").notNull().default(0),
		created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
		updated_at: text("updated_at"),
	},
	(t) => [
		index("idx_cast_title_id").on(t.title_id),
		index("idx_cast_actor_name").on(t.actor_name),
	],
);

export const history = sqliteTable(
	"history",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		title_id: integer("title_id")
			.notNull()
			.references(() => titles.id, { onDelete: "cascade" }),
		display_name: text("display_name"),
		year: integer("year").notNull(),
		sort_order: integer("sort_order").notNull().default(0),
		created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
		updated_at: text("updated_at"),
	},
	(t) => [index("idx_history_title_id").on(t.title_id)],
);
