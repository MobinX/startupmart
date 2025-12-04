ALTER TABLE `users`  ADD  "firebase_uid" text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `auth_provider` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `users_firebase_uid_unique` ON `users` (`firebase_uid`);