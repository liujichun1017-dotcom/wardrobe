CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`color` text DEFAULT '' NOT NULL,
	`season` text DEFAULT '四季' NOT NULL,
	`worn_count` integer DEFAULT 0 NOT NULL,
	`last_worn_at` text,
	`image_key` text,
	`notes` text DEFAULT '' NOT NULL,
	`extra_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL
);
