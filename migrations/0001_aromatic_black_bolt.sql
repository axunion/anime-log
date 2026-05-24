PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cast_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title_id` integer NOT NULL,
	`actor_name` text NOT NULL,
	`character_name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_cast_members`("id", "title_id", "actor_name", "character_name", "sort_order", "created_at", "updated_at") SELECT "id", "title_id", "actor_name", "character_name", "sort_order", "created_at", COALESCE("updated_at", "created_at") FROM `cast_members`;--> statement-breakpoint
DROP TABLE `cast_members`;--> statement-breakpoint
ALTER TABLE `__new_cast_members` RENAME TO `cast_members`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_cast_title_id` ON `cast_members` (`title_id`);--> statement-breakpoint
CREATE INDEX `idx_cast_actor_name` ON `cast_members` (`actor_name`);--> statement-breakpoint
CREATE INDEX `idx_cast_title_sort` ON `cast_members` (`title_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `__new_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title_id` integer NOT NULL,
	`display_name` text,
	`year` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_history`("id", "title_id", "display_name", "year", "sort_order", "created_at", "updated_at") SELECT "id", "title_id", "display_name", "year", "sort_order", "created_at", COALESCE("updated_at", "created_at") FROM `history`;--> statement-breakpoint
DROP TABLE `history`;--> statement-breakpoint
ALTER TABLE `__new_history` RENAME TO `history`;--> statement-breakpoint
CREATE INDEX `idx_history_title_id` ON `history` (`title_id`);--> statement-breakpoint
CREATE INDEX `idx_history_sort_order` ON `history` (`sort_order`);