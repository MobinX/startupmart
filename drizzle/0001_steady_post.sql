CREATE TABLE `startup_contacts` (
	`id` integer PRIMARY KEY NOT NULL,
	`startup_id` integer NOT NULL,
	`contact_email` text,
	`contact_phone` text,
	FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_startups` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`industry` text NOT NULL,
	`year_founded` integer NOT NULL,
	`description` text NOT NULL,
	`website_link` text,
	`founder_background` text NOT NULL,
	`team_size` integer NOT NULL,
	`sell_equity` integer NOT NULL,
	`sell_business` integer NOT NULL,
	`reason_for_selling` text NOT NULL,
	`desired_buyer_profile` text NOT NULL,
	`asking_price` real,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_startups`("id", "user_id", "name", "industry", "year_founded", "description", "website_link", "founder_background", "team_size", "sell_equity", "sell_business", "reason_for_selling", "desired_buyer_profile", "asking_price", "created_at") SELECT "id", "user_id", "name", "industry", "year_founded", "description", "website_link", "founder_background", "team_size", "sell_equity", "sell_business", "reason_for_selling", "desired_buyer_profile", "asking_price", "created_at" FROM `startups`;--> statement-breakpoint
DROP TABLE `startups`;--> statement-breakpoint
ALTER TABLE `__new_startups` RENAME TO `startups`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`current_pricing_plan` text DEFAULT 'free' NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "password_hash", "role", "current_pricing_plan", "created_at") SELECT "id", "email", "password_hash", "role", "current_pricing_plan", "created_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);