CREATE TABLE `favorites` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`startup_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`startup_id` integer,
	`plan_type` text NOT NULL,
	`amount` real NOT NULL,
	`status` text NOT NULL,
	`transaction_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `startup_assets` (
	`id` integer PRIMARY KEY NOT NULL,
	`startup_id` integer NOT NULL,
	`domain_ownership` text,
	`patents_or_copyrights` text,
	`source_code_link` text,
	`software_infrastructure` text,
	`social_media_handles` text,
	FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `startup_financials` (
	`id` integer PRIMARY KEY NOT NULL,
	`startup_id` integer NOT NULL,
	`monthly_revenue` text,
	`annual_revenue` text,
	`monthly_profit_loss` real,
	`gross_margin` real,
	`operational_expense` real,
	`cash_runway` real,
	`funding_raised` real,
	`valuation_expectation` real,
	FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `startup_legal` (
	`id` integer PRIMARY KEY NOT NULL,
	`startup_id` integer NOT NULL,
	`trade_license_number` text,
	`tax_id` text,
	`verified_phone` text,
	`verified_email` text,
	`ownership_documents_link` text,
	`nda_financials_link` text,
	FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `startup_operational` (
	`id` integer PRIMARY KEY NOT NULL,
	`startup_id` integer NOT NULL,
	`supply_chain_model` text,
	`cogs` real,
	`average_delivery_time` text,
	`inventory_data` text,
	FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `startup_sales_marketing` (
	`id` integer PRIMARY KEY NOT NULL,
	`startup_id` integer NOT NULL,
	`sales_channels` text,
	`cac` real,
	`ltv` real,
	`marketing_platforms` text,
	`conversion_rate` real,
	FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `startup_traction` (
	`id` integer PRIMARY KEY NOT NULL,
	`startup_id` integer NOT NULL,
	`total_customers` integer,
	`monthly_active_customers` integer,
	`customer_growth_yoy` real,
	`customer_retention_rate` real,
	`churn_rate` real,
	`major_clients` text,
	`completed_orders` integer,
	FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `startup_views` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`startup_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `startups` (
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
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);