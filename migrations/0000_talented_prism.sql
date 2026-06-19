CREATE TABLE `cast_members` (
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
CREATE INDEX `idx_cast_title_id` ON `cast_members` (`title_id`);--> statement-breakpoint
CREATE INDEX `idx_cast_actor_name` ON `cast_members` (`actor_name`);--> statement-breakpoint
CREATE INDEX `idx_cast_title_sort` ON `cast_members` (`title_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `history` (
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
CREATE INDEX `idx_history_title_id` ON `history` (`title_id`);--> statement-breakpoint
CREATE INDEX `idx_history_sort_order` ON `history` (`sort_order`);--> statement-breakpoint
CREATE TABLE `titles` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `title` text NOT NULL,
  `year` integer NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `titles_title_unique` ON `titles` (`title`);
