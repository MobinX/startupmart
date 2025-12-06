CREATE TABLE `plans` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`plan_for` text NOT NULL,
	`allowed_fields` text NOT NULL,
	`price` real DEFAULT 0 NOT NULL,
	`description` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_plans` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`plan_id` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`started_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`expires_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_plans_user_id_plan_id_unique` ON `user_plans` (`user_id`,`plan_id`);