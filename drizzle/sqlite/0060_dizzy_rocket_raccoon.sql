CREATE TABLE `team` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`organization_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `team_organizationId_idx` ON `team` (`organization_id`);--> statement-breakpoint
CREATE TABLE `team_member` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `teamMember_teamId_idx` ON `team_member` (`team_id`);--> statement-breakpoint
CREATE INDEX `teamMember_userId_idx` ON `team_member` (`user_id`);--> statement-breakpoint
ALTER TABLE `projects` ADD `client_team_id` text REFERENCES team(id) ON DELETE set null;--> statement-breakpoint
CREATE INDEX `projects_client_team_id_idx` ON `projects` (`client_team_id`);--> statement-breakpoint
ALTER TABLE `reports` ADD `client_visible_at` text;--> statement-breakpoint
ALTER TABLE `invitation` ADD `team_id` text;--> statement-breakpoint
ALTER TABLE `session` ADD `active_team_id` text;