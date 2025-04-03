PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_reviews` (
	`review_id` text PRIMARY KEY NOT NULL,
	`product_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_reviews`("review_id", "product_id", "user_id", "rating", "comment", "created_at") SELECT "review_id", "product_id", "user_id", "rating", "comment", "created_at" FROM `reviews`;--> statement-breakpoint
DROP TABLE `reviews`;--> statement-breakpoint
ALTER TABLE `__new_reviews` RENAME TO `reviews`;--> statement-breakpoint
PRAGMA foreign_keys=ON;